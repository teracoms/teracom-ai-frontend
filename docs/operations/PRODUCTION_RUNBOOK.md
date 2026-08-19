# Teracom AI — Production Runtime Runbook

**As of:** 2026-08-19 · **Scope:** Package OPS1 (Production Runtime and Service Management). Operational only — no application behaviour, UX, or business logic changed by this package. Applies to this single-host deployment (`teracom-ai` VM); see §7 for what changes on a multi-host or externally-facing deployment.

---

## 1. What's running, and how

Both services run as **user-level systemd units** (`systemctl --user`), not system-level (`/etc/systemd/system`) — this host has no passwordless sudo available to this operator, and user units achieve the same outcome (boot-start, auto-restart) via `loginctl enable-linger`, which does not require root.

| Service | Unit file | Binds | Managed by |
|---|---|---|---|
| Backend (FastAPI/Uvicorn) | `~/.config/systemd/user/teracom-backend.service` | `127.0.0.1:8000` (loopback only — not exposed off-host) | `systemctl --user` |
| Frontend (Next.js) | `~/.config/systemd/user/teracom-frontend.service` | `0.0.0.0:3000` (Next.js's own default bind — reachable from other hosts) | `systemctl --user` |

Source-of-truth copies of both unit files are versioned at `backend/deploy/systemd/teracom-backend.service` and `frontend/deploy/systemd/teracom-frontend.service` — install them by copying into `~/.config/systemd/user/` (see §5, "Deploying to a fresh host").

**Why user-level, not system-level:** the only alternative would be root-owned units in `/etc/systemd/system/`, which this operator cannot create without a password this session doesn't have. `loginctl enable-linger <user>` is explicitly designed to let a systemd **user** manager instance start at boot and keep running with no active login session — functionally equivalent to a system service for this purpose, and confirmed working (§6). If root access is obtained later, these same two unit files can be copied into `/etc/systemd/system/`, have their `WantedBy=default.target` changed to `WantedBy=multi-user.target`, and be managed with plain `systemctl` (no `--user`) instead — see §7.

## 2. Starting, stopping, and checking status

```bash
# Status (both)
systemctl --user status teracom-backend.service teracom-frontend.service

# Start / stop / restart (either, independently)
systemctl --user start   teracom-backend.service
systemctl --user stop    teracom-backend.service
systemctl --user restart teracom-backend.service
# ...same three verbs for teracom-frontend.service

# Is it set to start at boot?
systemctl --user is-enabled teracom-backend.service teracom-frontend.service
# Both should print: enabled

# Is it running right now?
systemctl --user is-active teracom-backend.service teracom-frontend.service
# Both should print: active
```

## 3. Logs

Both services log to the systemd **journal** (not a hand-rolled log file) — this was a deliberate choice: journald already gives rotation, timestamps, and structured querying for free, and avoids managing file permissions/rotation ourselves.

```bash
# Tail live logs
journalctl --user -u teracom-backend.service -f
journalctl --user -u teracom-frontend.service -f

# Last 50 lines, no paging
journalctl --user -u teracom-backend.service --no-pager -n 50

# Everything since a given time
journalctl --user -u teracom-backend.service --since "2026-08-19 06:00"
```

## 4. Health verification commands

Run these after any start/restart, or as a periodic external check:

```bash
# Backend — use the bare "/" route, not /docs. "Package SEC1" now
# disables /docs, /redoc, and /openapi.json entirely when
# ENVIRONMENT=production (see config.py/main.py) — a real deployment
# should set that, which would make the old /docs-based check below
# always fail even though the service is healthy. "/" is a genuine,
# permanently-unauthenticated liveness route regardless of ENVIRONMENT.
# Do NOT use GET /health/ for this either — it requires a logged-in
# user (get_current_user), so it will always 401 for an external
# monitor with no credentials.
curl -sf -o /dev/null -w "backend: %{http_code}\n" http://127.0.0.1:8000/
# Expect: backend: 200

# Frontend — the marketing homepage and the portal login page are both unauthenticated
curl -sf -o /dev/null -w "frontend /: %{http_code}\n" http://127.0.0.1:3000/
curl -sf -o /dev/null -w "frontend /portal/login: %{http_code}\n" http://127.0.0.1:3000/portal/login
# Expect: 200 for both

# One-line "is everything actually up" check
systemctl --user is-active teracom-backend.service teracom-frontend.service | grep -qv active && echo "SOMETHING IS DOWN" || echo "all active"
```

**Known startup latency:** the backend takes ~10–15 seconds to become reachable after a (re)start — it loads a local embedding model on startup (the "Loading weights" / HF Hub log lines). A health check run immediately after `systemctl --user start`/`restart` returning connection-refused for the first ~15 seconds is expected, not a failure; wait and recheck before concluding it's down.

## 5. Production startup procedure (fresh deploy or after a code change)

**Backend:**
```bash
cd ~/teracom-ai/backend
source venv/bin/activate
pip install -r requirements.txt   # only if dependencies changed
alembic upgrade head               # apply any new migrations
deactivate
systemctl --user restart teracom-backend.service
```

**Frontend:**
```bash
cd ~/teracom-ai/frontend
npm install       # only if dependencies changed
npm run build      # REQUIRED before every restart — systemd runs `next start`,
                    # which serves the existing .next build; it does not rebuild.
systemctl --user restart teracom-frontend.service
```

Then re-run the health checks in §4.

**Deploying to a fresh host** (systemd units aren't in version control by default — the app repos carry copies, but nothing installs them automatically):
```bash
mkdir -p ~/.config/systemd/user
cp ~/teracom-ai/backend/deploy/systemd/teracom-backend.service   ~/.config/systemd/user/
cp ~/teracom-ai/frontend/deploy/systemd/teracom-frontend.service ~/.config/systemd/user/
loginctl enable-linger "$USER"     # no sudo required; lets these run without an active login
systemctl --user daemon-reload
systemctl --user enable --now teracom-backend.service teracom-frontend.service
```

## 6. What was actually verified (this package's own validation)

- **Both services started cleanly** under `systemctl --user` and became reachable (backend `200` on `/docs`, frontend `200` on `/` and `/portal/login`).
- **Restart-on-failure, tested for real, not assumed:** `kill -9`'d each service's main PID directly and confirmed systemd started a new process (new PID) within seconds and the service became reachable again, for both backend and frontend independently.
- **Boot-enablement wiring confirmed:**
  - `systemctl --user is-enabled` reports `enabled` for both units.
  - Both are correctly symlinked into `~/.config/systemd/user/default.target.wants/`.
  - `loginctl show-user "$USER" -p Linger` reports `Linger=yes` — confirmed set (was `no` before this package).
  - `user@1000.service` (the system-level unit that hosts this user's systemd instance) is present and running; with linger enabled, systemd starts this at boot independent of any login session, which in turn reaches `default.target` and starts both app services.
- **Not yet verified: an actual physical/VM reboot.** Everything above is the standard, correct way to confirm boot-persistence without one, but a real reboot is the only *complete* proof, and this is a shared host with other active sessions — that test was deliberately not performed without asking first (see the implementation report's own note on this).

## 7. Known limitations and future follow-ups

- **User-level units, not system-level** — a consequence of no root access this session, not a deliberate architectural choice. If sudo access is obtained, migrate: copy both unit files to `/etc/systemd/system/`, change `WantedBy=default.target` to `WantedBy=multi-user.target` in each, `sudo systemctl daemon-reload`, `sudo systemctl enable --now teracom-backend teracom-frontend`. This removes the dependency on `loginctl enable-linger` entirely.
- **Single uvicorn worker, deliberately — reaffirmed, not fixed, by "Wave 2 Workstream 2" (Deployment & Health Readiness).** `auth/rate_limit.py`'s own docstring states its in-process rate limiter is "not shared across multiple worker processes" and names a Redis-backed limiter as the prerequisite for multi-worker deployment. Running `--workers >1` today would silently make login/signup/password-reset rate limiting inconsistent across workers. Do not add `--workers` to the backend unit's `ExecStart` until that limiter is replaced. That workstream deliberately scoped itself to what's safe to change today (the health endpoint and connection pool sizing below) and named this blocker explicitly rather than attempting to work around it.
- **A real, unauthenticated readiness probe now exists: `GET /healthz`** (Wave 2 Workstream 2) — distinct from the bare `GET /` liveness route (process-up only, never touches the database) and the existing authenticated `GET /health/`. Runs a real `SELECT 1` against the database and returns `200 {"status": "ok"}` on success, `503 {"status": "unavailable", "detail": ...}` on failure — point any external uptime monitor or orchestrator readiness check at this path, not `/health/` (which requires a valid JWT) or the bare `/` (which never verifies the database is reachable at all).
- **Database connection pool is now explicitly sized** (Wave 2 Workstream 2) — `DB_POOL_SIZE`/`DB_MAX_OVERFLOW` (defaults 10/20, double SQLAlchemy's previous implicit defaults of 5/10), replacing values that were never examined or configured before. These are sized for the current single-process deployment; revisit alongside the rate-limiter replacement above if multi-worker deployment is ever enabled.
- **Frontend binds `0.0.0.0`, backend binds `127.0.0.1` only** — intentional: the backend has no reason to be reachable from outside this host (the only consumer is the co-located Next.js server, via `BACKEND_API_URL=http://localhost:8000`), so it's loopback-only as a hardening default. If a future architecture needs the backend reachable from a separate frontend host, change `--host 127.0.0.1` to the appropriate interface and add a firewall rule — don't just open it to `0.0.0.0`.
- **No reverse proxy / TLS in front of either service, and this remains true today.** "Package SEC1" prepared real, deployable nginx config and a certbot runbook (`docs/operations/REVERSE_PROXY_AND_TLS.md`) but could not enable them live in this environment — see that document's own "Blockers" section for exactly why (no root access, no public domain/DNS pointing at this host). Both services are still served in plaintext on their raw ports. **Do not expose this host to the public internet until that document's blockers are cleared and its config is actually deployed.**
- **CORS is now enforced** (`Package SEC1`) — the backend rejects cross-origin browser requests from any origin not listed in `ALLOWED_CORS_ORIGINS` (empty/none by default). This has no effect on the app itself (the BFF pattern means the browser never calls the backend directly), so nothing to change here unless a future feature genuinely needs browser-side cross-origin access.
- **`/docs`/`/redoc`/`/openapi.json` are gated behind `ENVIRONMENT`** (`Package SEC1`) — still enabled by default (`ENVIRONMENT=development`, this host's current setting). **Set `ENVIRONMENT=production` in the backend's `.env` before any real public launch** — see §8 below for the full secrets/environment checklist that should happen at that same time.

## 8. Secrets management

- **File permissions**: both `.env` files are now `600` (owner read/write only) — previously `644` (group *and* world readable) on a multi-user host, fixed by "Package SEC1". Re-check this (`ls -la backend/.env frontend/.env`) after any file is recreated (e.g. `cp .env.example .env`), since a fresh copy inherits the umask, not the original's permissions.
- **No secrets manager exists** — every credential (`JWT_SECRET_KEY`, `DATABASE_URL`, `LICENSING_SIGNING_PRIVATE_KEY_B64`, `STRIPE_SECRET_KEY`, `ZOHO_*`, `ADMIN_IMPORT_TOKEN`) lives in a plaintext `.env` file on disk. Acceptable for a single-operator dev/staging host; not acceptable for a real production deployment with more than one person's access — migrating to a real secrets manager (Vault, AWS Secrets Manager, etc.) is tracked as a known gap, not solved by this package.
- **`JWT_SECRET_KEY` rotation procedure** (new — no rotation procedure existed before this package):
  1. Generate a new key: `python -c "import secrets; print(secrets.token_urlsafe(64))"`.
  2. **Understand the blast radius first**: rotating this key immediately invalidates *every* currently-issued access token *and* every stored refresh token, across all three identity planes (`User`, `StaffUser`, `PortalContact`) — every signed-in session everywhere is forced to log in again the moment the new key takes effect. There is no graceful dual-key transition today (verifying old-key tokens alongside new-key tokens) — this is a real, disruptive operational consequence, not a cosmetic one. Only rotate this key during a planned maintenance window, or in genuine response to a suspected key compromise where forcing every session to re-authenticate is the intended outcome.
  3. Update `JWT_SECRET_KEY` in `backend/.env`, then `systemctl --user restart teracom-backend.service`.
  4. There is no rotation procedure yet for `LICENSING_SIGNING_PRIVATE_KEY_B64`/`_PUBLIC_KEY_B64` — rotating those affects every *already-issued licence file*, a substantially bigger operation gated on the still-open questions in `docs/commercial/LICENSING_MODEL_V1.md` §19 (signing-key custody/rotation), not something to attempt ad hoc.
- **No log rotation policy configured beyond journald's own default retention** — acceptable for now; revisit if disk usage from logs becomes a real concern (`journalctl --disk-usage`).

## 9. SMTP / email delivery activation

**Current state:** `services/email_provider.py`'s `SmtpEmailProvider` is real, tested (including a real wire-level SMTP handshake against a live local socket — `tests/test_email_provider.py`), and requires **zero further engineering** to go live. `SMTP_HOST` is empty in this environment's `.env`, so `get_email_provider()` correctly falls back to `LoggingEmailProvider` — every notification is logged, not sent. This is a configuration and credential step, not a code change, and it is the one step in this runbook that requires a real external account this session cannot provision on its own.

**To activate real delivery**, set the following in `backend/.env` and restart the backend service (`systemctl --user restart teracom-backend.service`):

```
SMTP_HOST=<your mailbox or relay's hostname>
SMTP_PORT=<usually 587 for STARTTLS>
SMTP_USERNAME=<mailbox login, or blank for an unauthenticated relay>
SMTP_PASSWORD=<mailbox password or app-password>
SMTP_USE_TLS=true
SMTP_FROM_EMAIL=<the address recipients will see mail arrive from>
SMTP_FROM_NAME=Teracom AI
SALES_NOTIFICATION_EMAIL=<a real inbox for Contact Sales / Demo Request leads>
```

**A real Microsoft 365 mailbox** is the documented first target (`smtp.office365.com:587`, SMTP AUTH, no code changes) — this requires a real M365 account with SMTP AUTH enabled for that mailbox (disabled by default in many tenants; a tenant admin must explicitly allow it for the account) and its real password or an app-specific password if MFA is enabled. **Any other SMTP-capable provider works identically** — a dedicated transactional service (SendGrid, Postmark, Amazon SES, etc.) needs only its own host/port/username/API-key-as-password values; `SmtpEmailProvider`'s code has no Microsoft-specific branch.

**After setting real credentials, verify end to end**, not just that the process restarted cleanly:
1. Trigger one real notification (e.g. sign up a trial organisation, or use "Contact Sales") and confirm it actually arrives in a real inbox — check the spam folder too.
2. Check the admin Communications panel (`/portal/admin/communications`) for that send — it should show a real provider/status, not `"Logged (no provider configured)"`.
3. If using a mailbox with existing organisational SPF/DKIM, confirm alignment holds for mail sent through this specific path (some relays rewrite the `From` header in ways that break DKIM signing) — don't assume it does because the domain has SPF/DKIM configured for other purposes.

**This step could not be completed further in this session**: provisioning a real external mailbox or transactional-email account requires access this coding session doesn't have (a real email account, a real third-party service signup). Everything up to that point — the provider code, its wire-level correctness, and this activation runbook — is complete and tested.

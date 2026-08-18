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
# Backend — /docs (FastAPI's built-in Swagger UI) is unauthenticated and always present;
# do NOT use GET /health/ for this — it requires a logged-in user (get_current_user),
# so it will always 401 for an external monitor with no credentials.
curl -sf -o /dev/null -w "backend: %{http_code}\n" http://127.0.0.1:8000/docs
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
- **Single uvicorn worker, deliberately.** `auth/rate_limit.py`'s own docstring states its in-process rate limiter is "not shared across multiple worker processes" and names a Redis-backed limiter as the prerequisite for multi-worker deployment. Running `--workers >1` today would silently make login/signup/password-reset rate limiting inconsistent across workers. Do not add `--workers` to the backend unit's `ExecStart` until that limiter is replaced.
- **Frontend binds `0.0.0.0`, backend binds `127.0.0.1` only** — intentional: the backend has no reason to be reachable from outside this host (the only consumer is the co-located Next.js server, via `BACKEND_API_URL=http://localhost:8000`), so it's loopback-only as a hardening default. If a future architecture needs the backend reachable from a separate frontend host, change `--host 127.0.0.1` to the appropriate interface and add a firewall rule — don't just open it to `0.0.0.0`.
- **No reverse proxy / TLS in front of either service** — both are served in plaintext on their raw ports today. A production deployment reachable over the public internet should sit both behind a reverse proxy (nginx/Caddy) terminating TLS; out of scope for this package (no such proxy existed before it, and none was requested).
- **No log rotation policy configured beyond journald's own default retention** — acceptable for now; revisit if disk usage from logs becomes a real concern (`journalctl --disk-usage`).

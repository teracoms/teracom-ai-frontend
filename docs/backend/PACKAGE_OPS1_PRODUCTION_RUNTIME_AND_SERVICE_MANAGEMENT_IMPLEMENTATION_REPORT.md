# Package OPS1: Production Runtime and Service Management — Implementation Report

**Date:** 2026-08-19 · **Type:** Operational/infrastructure change, spanning both `teracom-ai-backend` and `teracom-ai-frontend` (unit files versioned in each; runbook filed in this repo) · **Scope:** production process management only — no application code, UX, or business logic changed. Directly motivated by the prior session's investigation into why port 3000 was intermittently occupied, which traced to both services being run ad hoc in foreground SSH terminals with no supervision.

---

## 1. The constraint this package was built against: no root access

Before any systemd unit could be written, `sudo -n true` was checked and failed ("a password is required") — this session has no passwordless sudo, so system-level units under `/etc/systemd/system/` (the conventional approach) were not available. Rather than stop or ask for credentials mid-task, `loginctl enable-linger <user>` was tried first — it succeeded with no privilege beyond the operator's own account, confirmed by `Linger` flipping from `no` to `yes`. This makes **user-level systemd units** (`systemctl --user`) a fully viable substitute: linger tells systemd to start that user's own systemd instance at boot independent of any login session, so a user unit with `Restart=on-failure` and `WantedBy=default.target` gets both boot-start and crash-recovery without root. This is the single design decision everything else in this package follows from, and is documented as a limitation (not a permanent architecture choice) in `PRODUCTION_RUNBOOK.md` §7, with the exact migration steps for if/when root access exists.

## 2. What was built

- **`frontend/package.json`**: `"start"` script changed from `"next start"` to `"next start -p 3000"` — locks the port at the one place both a human running `npm run start` by hand and systemd invoke, rather than only in the unit file (objective #6).
- **`~/.config/systemd/user/teracom-backend.service`** (versioned at `backend/deploy/systemd/teracom-backend.service`): runs `venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000` from the backend's own `WorkingDirectory` (so `config.py`'s `load_dotenv()` finds `.env` there unchanged), `Restart=on-failure`, `RestartSec=5`, `StartLimitBurst=5`/`StartLimitIntervalSec=60` (so a genuinely broken deploy fails loud after 5 rapid attempts instead of restart-looping forever), `After=network-online.target postgresql.service`.
- **`~/.config/systemd/user/teracom-frontend.service`** (versioned at `frontend/deploy/systemd/teracom-frontend.service`): runs `npm run start` (which now resolves to `next start -p 3000`), same restart/rate-limit posture, `After=`/`Wants=teracom-backend.service` so a manual `systemctl --user start` of the frontend also brings up the backend.
- **`docs/operations/PRODUCTION_RUNBOOK.md`** — the combined runbook/health-check/startup-procedure document (objectives #7–#9): start/stop/status commands, journal-based log access, health-check commands (with an explicit note that `GET /health/` is the wrong endpoint to use for this, since it requires an authenticated user — `/docs` is the correct unauthenticated liveness check), the production startup procedure for both a code-change redeploy and a fresh host, and the exact commands used to validate this package (§6 below), plus known limitations (§7).

Deliberately **not** built: any log-rotation scheme beyond journald's own defaults, a reverse proxy/TLS layer, or multi-worker uvicorn — the last one specifically because `auth/rate_limit.py`'s own docstring states its in-process rate limiter is not safe across multiple worker processes; running `--workers >1` today would silently break login/signup/password-reset rate limiting consistency. Both are recorded as explicit follow-ups, not silent gaps.

## 3. Why loopback-only for the backend, but not the frontend

`--host 127.0.0.1` for the backend (not `0.0.0.0`, which is how it had been run ad hoc in earlier sessions) is a deliberate hardening decision, not an oversight: the only consumer of this API is the co-located Next.js server (`BACKEND_API_URL=http://localhost:8000`), so there is no reason for it to be reachable from outside this host. The frontend keeps Next.js's own default bind (`0.0.0.0`) since it's the actual user-facing surface. Documented explicitly in the runbook so a future operator doesn't "fix" the backend back to `0.0.0.0` without understanding why it was narrowed.

## 4. Validation — real, not assumed

Every check below was actually run against the live services this package created, not inferred from the unit file contents:

- **Startup:** both services started via `systemctl --user start`; confirmed `active (running)` via `systemctl --user status`; confirmed real HTTP reachability — backend `200` on `GET /docs`, frontend `200` on both `GET /` and `GET /portal/login`.
- **Restart-on-failure:** `kill -9`'d each service's actual main PID (read via `systemctl --user show -p MainPID`, not guessed) and confirmed systemd started a **new** PID within seconds and the service was reachable again — done independently for both backend and frontend, not just one as a proxy for the other.
- **Boot-enablement:** `systemctl --user is-enabled` reports `enabled` for both; both are symlinked into `~/.config/systemd/user/default.target.wants/`; `loginctl show-user -p Linger` reports `yes`; `user@1000.service` (the system unit hosting this user's systemd instance) confirmed present. Postgres itself (a dependency of the backend) was independently confirmed already `enabled` at the system level.
- **Port lock:** confirmed via `ss -tlnp` that the frontend is bound to `:3000` and the backend to `127.0.0.1:8000` only (not `0.0.0.0:8000`).

**Explicitly not done: an actual reboot.** Every check above is the standard, correct way to confirm boot-persistence short of one, but a real reboot is the only fully conclusive proof, and this is a shared host with the project owner's own active SSH sessions (three logged in at the time of this work) and other running processes not managed by systemd. Rebooting it is a hard-to-reverse-in-the-moment action affecting more than this package's own scope — it was deliberately not performed without asking first. See the chat response accompanying this report for that question.

## 5. Explicitly not done

- No system-level (`/etc/systemd/system`) units — no root access this session; see §1 and `PRODUCTION_RUNBOOK.md` §7 for the migration path if that changes.
- No actual reboot test (§4) — needs explicit go-ahead given the shared-host blast radius.
- No reverse proxy, TLS termination, or public-internet exposure hardening beyond the loopback bind already described.
- No multi-worker backend scaling — blocked on the rate limiter's own documented single-process assumption, not attempted here.
- No log rotation beyond journald's own defaults.
- No UX, business-logic, or application-behaviour changes of any kind. This package's only change to either application repo is the one-line `package.json` script edit (§2) — no backend code was touched at all, so the backend test suite is unaffected by definition and was not re-run. `npm run lint` and `npm test` were re-run after the edit: 295/295 passing, zero lint warnings, unchanged from before this package.

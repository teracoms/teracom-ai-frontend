# Reverse Proxy & TLS Readiness ("Package SEC1")

**Status: prepared, not deployed.** This document and `nginx/teracom.conf` alongside it are real, ready-to-use artifacts — not a design sketch. They are not live anywhere today. Read §1 before assuming this can simply be turned on.

---

## 1. Why this isn't live yet — two real blockers

Both of these are infrastructure/business dependencies, not engineering work this package can complete on its own:

1. **No root access on this host.** `sudo -n true` fails (`sudo: a password is required`), confirmed fresh during this package. Installing nginx (`apt install nginx`) and binding ports 80/443 both require root. Neither is possible in this environment as it stands.
2. **No public domain or DNS record points at this host.** `hostname -f` returns `teracom-ai` (not a resolvable public name) and the host's only address is a private LAN IP (`10.0.0.193`). Let's Encrypt's HTTP-01/DNS-01 challenges both require a real, publicly-resolvable domain — there is nothing to request a certificate *for* yet.

**Neither blocker is something more code can fix.** They require, respectively: sudo/root access to this host (or migrating to a host where it exists), and a registered domain with a DNS A/AAAA record pointing here.

**Until both are resolved, this host should not be exposed to the public internet.** The frontend currently binds `0.0.0.0:3000` in plaintext — reachable, unencrypted, from anywhere with network access to this machine. Treat this environment as private/internal-only until this document's steps below are actually carried out.

## 2. Deployment steps, once both blockers are cleared

```bash
# 1. Install nginx and certbot (requires root)
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Copy the prepared config, filling in the real domain
sudo cp nginx/teracom.conf /etc/nginx/sites-available/teracom.conf
sudo sed -i 's/REPLACE_WITH_REAL_DOMAIN/<your-real-domain>/g' /etc/nginx/sites-available/teracom.conf
sudo ln -s /etc/nginx/sites-available/teracom.conf /etc/nginx/sites-enabled/
sudo nginx -t   # validate syntax before reloading

# 3. Obtain a real certificate (certbot's nginx plugin edits the config
#    in place to point at the issued cert — or run --webroot with the
#    /.well-known/acme-challenge/ location already prepared in the config)
sudo certbot --nginx -d <your-real-domain>

# 4. Reload
sudo systemctl reload nginx

# 5. Verify
curl -I https://<your-real-domain>/
curl -I http://<your-real-domain>/   # should 301 to https://
```

**Certificate renewal**: certbot installs its own systemd timer (`certbot.timer`) that renews automatically before the 90-day expiry — no manual cron job needed. Confirm it's active: `systemctl list-timers | grep certbot`.

## 3. What does NOT change on the app side

- The backend keeps binding `127.0.0.1:8000` — it is never proxied publicly (see the config file's own comment on why: ADR-002's BFF pattern means the browser never calls it directly, so there's no reason to expose it).
- The frontend's own bind (`0.0.0.0:3000` today) does not need to change once this proxy is in front of it — nginx becomes the actual public entry point on 80/443, and 3000 becomes reachable only from the proxy and localhost in practice (a host firewall rule restricting 3000 to localhost + nginx's own address is a good follow-up hardening step once this is live, but isn't required for the proxy itself to work).
- Nothing in either application's own code needs to change — this is purely an infrastructure layer sitting in front of the existing, unmodified frontend service.

## 4. Interim guidance until this is deployed

- Continue treating this host as a private/internal environment, not a public production deployment.
- If any external party needs to reach this host in the meantime, prefer an SSH tunnel or a temporary, narrowly-scoped VPN over exposing port 3000 directly.
- Re-run this package's own CORS and `/docs` lockdown checks (`docs/operations/PRODUCTION_RUNBOOK.md` §7-8) as part of the same maintenance window this proxy eventually goes live in — `ENVIRONMENT=production` should be set at that point too, not left for a separate pass.

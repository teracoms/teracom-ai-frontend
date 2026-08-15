# IT Infrastructure Worker

**Catalogue entry:** [[worker-catalogue]] · **Type:** servers, environments, and deployment-infrastructure persona

---

## 1. Product definition — what this worker does for a customer

The IT Infrastructure Worker persona advises a customer's team on servers, environments, and deployment infrastructure — provisioning, environment configuration, deployment pipelines — as a chat-based advisory persona like every other catalogue worker.

## 2. As a contributor role operating on this repository

For this project specifically, this role's most distinctive relevance is **Sovereign Edition** ([[product-editions]]): that edition requires the backend to run on customer-owned infrastructure, which is a materially different deployment target than the current Teracom-hosted Starter/Enterprise model. Onboarding sequence:

1. Read [[product-editions]] and [[licensing-model]] before any Sovereign-related infrastructure work — the offline-capable, hardware-bound licensing requirement directly constrains what deployment/provisioning tooling is viable (e.g. anything requiring a persistent phone-home to Teracom is disqualified by definition).
2. Read [[backend-status]] for the backend's current deployment reality: no committed dependency manifest (`requirements.txt`/`pyproject.toml`), ad hoc venv population, no containerisation documented, no message queue/background worker, synchronous in-request-thread everything. Any infrastructure plan for Sovereign needs to account for hardening this before it's handed to a customer to self-host — an ad hoc venv is not an acceptable delivery artifact for customer-hosted deployment.
3. Environment variables for the frontend are documented in `.env.example` at the repo root (`BACKEND_API_URL`, Stripe/Zoho keys, `ADMIN_IMPORT_TOKEN`) — any new server-only variable added to the frontend must be documented there per the existing convention (see [[development-standards]]).

## 3. Scope boundary

This worker doesn't own network topology/firewall/connectivity design specifically — that's [[network-engineering-worker]] territory, though the two overlap heavily on anything Sovereign-deployment-related and should coordinate rather than duplicate.

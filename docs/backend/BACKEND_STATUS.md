# Backend Status

**⚠️ Second-hand documentation.** `teracom-ai-backend` is a separate repository, not checked into `teracom-ai-frontend`. Everything in this document is derived from the backend review conducted in `docs/frontend/FRONTEND_ARCHITECTURE.md` Part B (dated at that document's authorship) plus references made *about* the backend inside the two implementation reports. **No one has re-verified this against the live backend source while building this knowledge base.** Treat it as "last known state, as reported," not as ground truth — anyone with direct backend access should verify before relying on specifics here, and should update this file (and ideally establish a real `docs/backend/IMPLEMENTATION_REPORTS/` feed from that repo) once they do.

---

## 1. Stack (as reported)

FastAPI (`main.py`, ~45 routers via `include_router`), SQLAlchemy 2.0-style ORM, PostgreSQL, JWT auth (`python-jose`, HS256), `passlib`/bcrypt password hashing, Chroma (embedded persistent vector store) for RAG, `sentence-transformers` (`all-MiniLM-L6-v2`, CPU) for embeddings, Ollama (local LLM, default `llama3`) for chat generation. No message queue, no cache layer, no background worker/task runner — everything synchronous, in-request-thread. No committed dependency manifest (`requirements.txt`/`pyproject.toml`) — venv populated ad hoc.

## 2. Domain model (as reported)

Five core tables, UUID-keyed, all tenant-scoped by `organisation_id`:

- **`organisations`** — `id, name, slug`. No plan/tier/seat/status field — this is *the* gap blocking [[commercial-model]]/[[licensing-model]] implementation.
- **`users`** — `id, organisation_id, first_name, last_name, email(unique), password_hash, role(free string)`. No `is_active`, no `last_login`, no email verification.
- **`workers`** — `id, organisation_id, name, role, purpose, instructions, status`. This is the technical substrate for [[worker-catalogue]] — an AI agent persona, not a human record.
- **`knowledge`** — `id, organisation_id, title, content(text), source`. Stored inline in Postgres and embedded into Chroma.
- **`knowledge_permissions`** — join table `(worker_id, knowledge_id)`.
- **`chat_sessions`** / **`chat_messages`** — one worker has many sessions; each session belongs to one user.
- **`worker_memories`** — `worker_id, memory_type, memory_content`, attached to a worker, not a user/session. `memory_type` is always `"fact"` in practice (set by the store path) — not currently a meaningful facet.

Multi-tenant isolation is reported as solid: every list/detail endpoint filters by `organisation_id`, and ownership-check helpers (`get_owned_worker`/`get_owned_knowledge`/`get_owned_session`) 403 on cross-tenant access.

## 3. Authentication & authorization (as reported)

- `POST /auth/login` takes `email`/`password` as **query parameters**, not a JSON body — a known quirk the frontend's BFF pattern (ADR-002) exists specifically to route around.
- JWT, 60-minute expiry, **no refresh token, no rotation, no logout/revocation endpoint.**
- `require_role(role)` is **exact string equality**, no hierarchy, no central enum of valid role values.
- Login brute-force limiter: in-process sliding window, 5 attempts/15 min/15 min lockout, keyed on `(IP, email)` — explicitly **process-local**, resets on restart, not shared across instances.
- A security hardening pass is reported as already completed (referenced as `FINAL_SECURITY_REMEDIATION.md`, dated 2026-08-14 in the source material) — upload path traversal fixed, filename sanitisation, extension allow-list, streaming size-limit enforcement, secrets externalised to `.env`, malformed-password-hash crash fixed. See [[remediation-history]] for what's known about this, with the same second-hand caveat.

## 4. Endpoint inventory highlights (as reported)

Full grouped inventory lives in `docs/frontend/FRONTEND_ARCHITECTURE.md` §B.4 — not duplicated here to avoid drift between two copies. Headline points worth keeping in working memory:

- **Five-plus near-duplicate dashboard aggregate endpoints** (`/dashboard/`, `/portal-dashboard/`, `/platform/summary`, `/system/overview`, `/stats/platform`) — frontend has standardised on `/portal-dashboard/` as canonical (ADR-007).
- **Connectors (SharePoint/OneDrive/Teams) are 100% hardcoded stubs** — `"status": "available"`/`"connected"` regardless of reality; no real OAuth/Graph integration exists.
- **No pagination/filtering/sorting on any list endpoint** except two hardcoded "recent" endpoints (limited to 10).
- **Chat is fully synchronous, non-streaming** — one blocking HTTP call per message, no SSE/WebSocket.
- **Zero billing/subscription/plan/seat/entitlement concept anywhere** — the single largest gap relative to [[commercial-model]].
- No worker-edit, worker-delete, user-role-change, user-deactivation, or user-delete endpoints exist.

## 5. Key architectural gaps (as reported) — carried into frontend risk tracking

1. No CORS middleware anywhere — forces the frontend's BFF/proxy pattern (ADR-002).
2. Login credentials as query parameters, not JSON body — needs a backend `LoginRequest` model; the frontend cannot fully mitigate this from its side.
3. No refresh tokens / no logout endpoint / no role hierarchy / no user deactivation.
4. Zero billing/licensing data model — blocks [[roadmap]] Package 9 entirely until resolved backend-side.
5. Connectors are placeholder stubs mislabelled as available/connected.
6. No pagination anywhere — not urgent at current data volumes, will need addressing.
7. Chat has no streaming.
8. No dependency manifest committed.

## 6. Combined verdict (as reported at time of the architecture review)

"Functionally usable for a first integration; not production-safe as-is." Multi-tenant isolation and the RAG pipeline (Chroma + sentence-transformers + Ollama) were assessed as real and working, not stubs. The security hardening pass was assessed as genuine, not cosmetic. The gaps in §5 were assessed as acceptable to build V1 around (per the frontend's own designed workarounds) but not a permanent acceptable state.

## 7. What would make this document first-hand instead of second-hand

Someone with direct access to `teracom-ai-backend` should: (a) confirm the facts above are still accurate, (b) start populating `docs/backend/IMPLEMENTATION_REPORTS/` with real reports from that repo's own work, (c) consider whether this frontend repo's `docs/backend/` should instead be a thin pointer to a `docs/` tree living in the backend repo itself, to avoid two divergent copies of backend truth over time.

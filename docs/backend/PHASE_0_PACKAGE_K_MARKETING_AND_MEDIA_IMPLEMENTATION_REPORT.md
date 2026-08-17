# Phase 0 Package K: Marketing & Media Platform — Implementation Report

**Date:** 2026-08-17 · **Type:** Code change, spanning both `teracom-ai-backend` (sibling repository) and `teracom-ai-frontend` (this repository) · **Scope:** Package K only, extending Package J (Sales & Customer Success Platform, `5725ee4` backend / `13844ae` frontend) and Package I (Department Head Layer & Executive Organisation).

---

## 1. Scope and the design decisions this package was built against

A research pass into this project's own precedent (Package I's Department Head docs, Package J's CRM/approval/connector shapes, Package 8's Connectors, the current Worker Catalogue) surfaced one consequential finding before any code was written: unlike Head of Sales/Head of Customer Success — which got dedicated advisory-only executive docs in Package I before Package J built their operational counterparts — `docs/workforce/MARKETING_MANAGER_WORKER.md` already stated Marketing Manager Worker fills the Head of Marketing role. Five design decisions were confirmed with the user before implementation:

1. **Head of Marketing is retrofitted, not split.** Marketing Manager Worker keeps its existing scope and gains the campaign/dashboard/governance mechanics this package builds — no new, near-duplicate advisory-only executive doc.
2. **A genuinely sequential three-tier pipeline** — Marketing Manager → Content Producer → Video Producer — a new pattern shape for this catalogue; every prior split (CTO/Developer, Sales, Customer Success) is two-tier. Video Producer's brief comes from an *approved* Content Producer output, not from Marketing Manager directly.
3. **The YouTube integration is a cosmetic stub**, mirroring Package 8's/Package J's connector precedent exactly — never wired to a real API.
4. **Media Centre is a new dedicated model**, not an extension of Package 4's Knowledge/Document model.
5. **`Campaign`/`ContentPiece`/`VideoAsset`/`MediaCentreItem` are organisation-scoped**, matching `CrmContact`'s precedent — not department-scoped. `Department.function → "marketing"` CTO-routing integration stays explicitly out of scope, same standing gap already flagged for `"sales"`/`"customer_success"`.

**Governance mapping — this package originates a new rule, unlike ADR-013/014 which mapped onto existing ones:** a repo-wide search confirmed no existing governance rule covers content or media publishing. Package K originates: "human approval required before content or video is publishable (the submit → admin-decide gate), and a further explicit admin action required before a Media Centre item is actually marked published." Only content and script *drafting* get AI-assist (a new `marketing_intelligence` capability, Enterprise+); submitting, deciding, publishing, and marking-published are always explicit human/admin actions.

**Backend:** 9 modified, 24 new. **Frontend:** 12 modified, 27 new. Nothing committed in either repository, per this series' convention.

## 2. Files created/changed (backend)

**New models:** `models/{campaign,content_piece,video_asset,media_centre_item,marketing_audit_log}.py`. **New schemas:** the matching five under `schemas/`, plus `schemas/marketing_summary.py`. **New services:** `services/{campaign_service,content_service,video_service,media_centre_service,marketing_summary_service}.py`, `services/media_connectors/{base_connector,youtube_connector}.py`, `services/media_connector_status_service.py`. **New API routers:** `api/{campaigns,content,videos,media_centre,marketing_summary,media_connectors}.py`. **New migration:** `alembic/versions/fee80d90d0de_...py`. **New tests:** `tests/test_marketing.py`.

**Modified:** `services/entitlement_service.py` (+ `marketing_intelligence` capability), `main.py` (six new router registrations), `alembic/env.py`/`create_tables.py`/`tests/test_migrations.py` (import the five new models). No change was needed to `models/department.py`/`schemas/department.py`/`services/department_service.py`/`api/departments.py` — `Department.function` was already an unconstrained nullable string from Package J; `"marketing"` is accepted as a third convention value with zero code change (confirmed live, §5).

## 3. Marketing Manager retrofit, Content Producer, Video Producer (objectives #1–#4)

Marketing Manager Worker and Content Production Worker already existed in the catalogue (added 2026-08-15) — this package adds one new entry, `docs/workforce/VIDEO_PRODUCER_WORKER.md`, the pipeline's third tier. `Campaign.owner_worker_id` (nullable FK `workers.id`) is the mechanism by which a Marketing Manager Worker is attributed to a campaign — none of the three personas is a backend-enforced worker "type"; like every worker in this catalogue, they are plain `Worker` rows.

## 4. Campaign management, content production, video production, the pipeline handoff (objectives #5, #6, #7, #12)

`Campaign.stage` (`planning`|`active`|`completed`) is the single field carrying a campaign through its life — `services/campaign_service.py#update_stage()` enforces a forward-only transition via the same plain, explicitly-checked list pattern as `crm_contact_service.py`. `ContentPiece`/`VideoAsset` share `Proposal`'s submit → admin-decide shape exactly (`status`: draft|submitted|approved|rejected). `VideoAsset.content_piece_id` (nullable FK) optionally chains from an *approved* content piece — `services/video_service.py#draft_script()` reads that content piece's own `content` text directly into its Ollama prompt when provided, the concrete realisation of objective #12's pipeline handoff. Verified live (§5): a real AI-drafted video script explicitly referenced "the source content" in its own generated text, confirming the handoff is genuine, not merely a foreign-key link.

## 5. Content approval workflows and the originated governance rule (objective #10, governance)

`POST /content/`/`POST /videos/` create-and-submit in one step for the manual-entry path; `POST /{resource}/{id}/decide` (admin-only) is the human-approval gate, setting `status` and recording `decided_by_user_id`/`decided_at`/`decision_notes`. `POST /content/draft` and `POST /videos/draft-script` (both gated by the new `marketing_intelligence` capability) generate content/script via a real Ollama call, persisting a `"draft"`-status row a human must still explicitly submit. Every transition writes a `MarketingAuditLog` row — verified live to record all eight expected `event_type` values for a single campaign's full journey (§7).

## 6. Media Centre foundation (objective #8)

`services/media_centre_service.py#publish_item()` creates a `MediaCentreItem` in `"ready"` status only from an *approved* `ContentPiece`/`VideoAsset` — raising `ValueError` (surfaced as a 400) otherwise; never an automatic side effect of approval. `mark_published()` — the second half of this package's originated governance rule — is admin-only (`require_role("admin")` on `POST /media-centre/{id}/mark-published`) and only accepts a `"ready"` → `"published"` transition. Verified live: a `member` successfully published a ready item but was `403`'d marking it published; an admin then succeeded.

## 7. YouTube integration abstraction layer (objective #9)

`services/media_connectors/base_connector.py#BaseMediaConnector` mirrors `services/crm_connectors/base_connector.py` (Package J) and `services/connectors/base_connector.py` (Package 8) exactly — `connect()`/`sync()` raise `NotImplementedError`, `status()` returns `{"status": "not_implemented"}`. `YoutubeConnector` mirrors the stub subclass shape exactly, overriding only `connect()`/`sync()` with hardcoded dicts. `api/media_connectors.py` (`GET /media-connectors/youtube`, `GET /media-connectors/status`) returns hardcoded `"coming_soon"` responses — the connector class itself is never imported by any router, dead code by design.

## 8. Executive marketing dashboards; CTO dashboard visibility; Executive Organisation integration (objectives #11, #14, #15)

`services/marketing_summary_service.py#get_marketing_summary()` returns fully-keyed campaign-stage counts, content/video status counts, pending-decision counts, and Media Centre ready/published counts — `GET /marketing/summary` (any org member, read-open like `crm_pipeline`). `Department.function = "marketing"` (objective #14's integration point) lets the frontend identify which department's dashboard should show the marketing widget — the same `PATCH /departments/{id}/function` endpoint Package J built, no backend change needed. Marketing summary data is surfaced as a dashboard widget on both the Marketing department's own dashboard and `/portal/cto` (frontend §8) — not woven into the CTO chain's own Ollama synthesis context, the same integration depth Package J gave CRM pipeline data.

## 9. Validation

### Build
`python -c "import main"` succeeds; every new endpoint confirmed present via the app's own routes (`main.app.routes`, 74 total routes after registration).

### Tests
`python -m pytest tests/` — **152 passed** (11 new Package K tests — 3 unit tests for `_is_legal_stage_transition` covering forward moves including skipping "active", the same-stage no-op, and rejected backward moves; 5 cheap gating/isolation tests covering admin-only decisions on content and video, the admin-only mark-published gate, cross-org campaign isolation, and the `marketing_intelligence` tier gate on both draft endpoints; 3 real-Ollama tests — one AI-drafted content piece, one AI-drafted video script informed by an approved content piece (asserting the response's own `content_piece_id` matches), and one full campaign-lifecycle integration test confirming `marketing_audit_log` recorded the complete event set across campaign/content/video/media-centre subjects). All 141 pre-existing tests (Packages 1/2/A–J) pass unmodified.

### Migration verification
Generated via `alembic revision --autogenerate` (`down_revision = 'fd7dd57780a1'`, Package J's head); like Package J's own migration, no hand-fix was needed for an unnamed FK constraint — no column was added to `departments` this time (`"marketing"` needed no schema change) and every new table's FKs are inline `CREATE TABLE` constraints. `tests/test_migrations.py`'s isolated-schema upgrade → downgrade → re-upgrade round trip passed cleanly. Applied to the real dev database.

### End-to-end verification (full-stack, live)
Started a real backend (port 8001) and frontend (port 3001) against the actual dev Postgres database and the genuinely-running local Ollama instance. Signed up a fresh customer, seeded a real staff user, approved a real Enterprise licence, created a Marketing department and set its `function` to `"marketing"` (confirmed: no schema change needed, the endpoint accepted the new value immediately), created a Marketing Manager, Content Producer, and Video Producer worker. Then, all against the live HTTP API and the real frontend:

- Created a campaign, attributed it to the Marketing Manager worker, moved it to `"active"`.
- Generated a real AI-drafted content piece (~19 seconds) — genuine, on-brief marketing copy, correctly left in `"draft"` status until explicitly submitted.
- Submitted the content, confirmed a `member` user is `403`'d attempting to decide it, then approved it as admin.
- Generated a real AI-drafted video script (~34 seconds) informed by the approved content piece — the script's own generated text explicitly stated "This script... builds on the source content", direct proof the Content Producer → Video Producer pipeline handoff is genuine, not just a stored foreign key.
- Submitted and approved the video the same way, confirming the `member`-403/admin-200 pattern again.
- Published the approved video to the Media Centre (any member can do this, gated only by the source item's approval status), confirmed a `member` is `403`'d marking it published, then marked it published as admin.
- Marked the campaign `"completed"`.
- Confirmed `GET /marketing/summary` correctly reported one completed campaign, one approved content piece, one approved video, zero pending decisions, and one published Media Centre item.
- Confirmed via the frontend's own BFF proxy routes that a `member` can submit content but is `403`'d attempting to decide it — the governance gate holds through the full stack, not just the direct backend API.
- Confirmed the real frontend's Marketing department dashboard, `/portal/cto`, `/portal/marketing`, and `/portal/media-centre` pages all rendered correctly (campaign name, video title, and the marketing summary widget's own heading text all present in the rendered HTML).
- Queried `marketing_audit_log` directly: all eight expected `event_type` values recorded (`campaign_created`, `campaign_stage_changed` ×2, `content_submitted`, `content_decided`, `video_submitted`, `video_decided`, `media_centre_item_published`, `media_centre_item_marked_published`), each with exactly one populated subject FK matching its event type.

All verification data (the test organisation, its two users, the department, all three workers, the campaign, both content pieces, the video asset, the Media Centre item, all marketing audit log rows, the licence/licence request, and the seeded staff user) was deleted from the real dev database afterward; both temporary server instances were stopped — the `next-server` child process required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper (a known quirk from prior packages) — confirmed by a follow-up `curl` against both ports returning connection-refused.

## 10. Explicitly not done

- No real YouTube API integration — stub connector only, per the confirmed design decision.
- No AI-authored publication decisions — drafting content/scripts may be AI-assisted; submitting, deciding, publishing, and marking-published are always explicit human/admin actions.
- No hard DB-enforced requirement that a Contract... (n/a to this package) — no hard requirement that a Media Centre item exist before a campaign is marked `"completed"`, or that a video must chain from a content piece — soft, documented conventions only.
- No change to CTO Orchestration's `_pick_worker_for_subtask()` — `Department.function = "marketing"` is a dashboard/routing-identity signal in this package, not a delegation-matching one; the same standing gap already flagged for `"sales"`/`"customer_success"`.
- No update or delete endpoint for `Campaign`/`ContentPiece`/`VideoAsset`/`MediaCentreItem` — the same standing "create and read/decide only" gap this project has repeatedly flagged, now on a fourth data model.
- No department-scoping on `Campaign`/`ContentPiece`/`VideoAsset`/`MediaCentreItem` — organisation-wide, same trade-off `CrmContact` already made.
- No git commit in either repository — all changes remain uncommitted, per this series' standing convention.

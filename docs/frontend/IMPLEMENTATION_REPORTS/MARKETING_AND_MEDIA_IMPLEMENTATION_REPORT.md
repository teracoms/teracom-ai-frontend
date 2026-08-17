# Marketing & Media Implementation Report — Phase 0 Package K

**Scope:** Package K — Marketing & Media Platform, spanning both this repository and `teracom-ai-backend` (sibling repository). No pre-existing `*_MVP_V1.md` design document existed for this package (same situation as Packages G–J) — see the backend report's §1 for the five design forks resolved with the user before any code was written, including the consequential finding that Head of Marketing was never split from Marketing Manager Worker the way Head of Sales/Head of Customer Success were.
**Status:** Complete, validated (build + lint + tests pass), end-to-end smoke-tested against a running `teracom-ai-backend` instance and a real local Ollama instance, as both an admin and a `member` user.
**Depends on:** Packages 1–9, G, H, I, and J — session cookie/`getSessionToken()`, `AuthProvider`/`useAuth()`, `PortalNav`, `EmptyState`, `settle`/`errorMessage`, the BFF-proxy pattern, `fetchWorkerList`, Package J's `DealDocumentPanel` (the shared-component precedent this package's `ContentPiecePanel`/`VideoAssetPanel` follow, though as two components rather than one — see §5), and Package I/J's `DepartmentDashboard`/`DepartmentFunctionControl` (extended, not replaced).
**Out of scope (unchanged, not implemented):** Billing & Licensing (still a UX scaffold, Package 9); real YouTube API integration; AI-authored publication decisions.

---

## 1. What was built

| Route | Purpose |
|---|---|
| `/portal/marketing` | New: the Marketing Manager workspace — campaign creation, stage-filterable campaign list |
| `/portal/marketing/:campaignId` | New: campaign detail — stage control, content production panel, video production panel |
| `/portal/media-centre` | New: the Media Centre foundation workspace — publish approved content/video, admin-only mark-published |
| `/portal/admin/departments` (extended) | `DepartmentFunctionControl` gains a `"marketing"` option |
| `/portal/departments/:departmentId` (extended) | Shows a marketing summary widget when `function === "marketing"` |
| `/portal/cto` (extended) | Also shows the marketing summary widget — objective #15's CTO-dashboard visibility |
| 12 new BFF routes | Campaign create/stage, content submit/draft/submit-drafted/decide, video submit/draft-script/submit-drafted/decide, media-centre publish/mark-published |

## 2. Backend verification performed before writing any code

Per this series' established discipline, `teracom-ai-backend`'s new Package K source was read directly as it was built alongside this frontend work — `models/{campaign,content_piece,video_asset,media_centre_item}.py`, `schemas/*`, `services/{campaign_service,content_service,video_service,media_centre_service,marketing_summary_service}.py`, and `api/{campaigns,content,videos,media_centre,marketing_summary}.py`.

Confirmed directly, driving the frontend's own design:

- **`Department.function` needed zero backend schema change to accept `"marketing"`** — the column was already an unconstrained nullable string from Package J. `DepartmentFunctionControl`'s new `<option value="marketing">` and `validation.js`'s `DEPARTMENT_FUNCTIONS` array are the only changes required; confirmed live (backend report §5) that the endpoint accepted the value immediately.
- **`ContentPiece`/`VideoAsset` share `Proposal`'s exact submit → admin-decide shape**, but the two entities' own bodies differ (`content` vs. `script`, plus video's optional `content_piece_id`) — unlike Package J's `DealDocumentPanel` (one component, three kinds), this package built two separate components (`ContentPiecePanel`, `VideoAssetPanel`) rather than force a single component to branch on field names that don't actually overlap cleanly.
- **`POST /content/draft` and `POST /videos/draft-script` both take `worker_id` as a query parameter**, matching Package J's `draftProposal()` precedent exactly — `lib/api/marketingProduction.js`'s `draftContent()`/`draftScript()` pass it via `backendFetch`'s `searchParams` option.
- **`POST /videos/draft-script` optionally accepts `content_piece_id`, which the backend validates must reference an *approved* content piece** (400 otherwise) — `VideoAssetPanel`'s source-content picker is populated only from `approvedContentPieces` (pre-filtered server-side in the campaign detail page), so a user cannot even select an unapproved one from this UI, though the backend remains the real enforcement.
- **A campaign's `stage` only ever moves forward** (backend 400s a backward move) — `CampaignDetail`'s stage `<select>` only ever offers the current stage and later ones (`STAGE_ORDER.slice(currentIndex)`), the identical pattern `ContactDetail` (Package J) already established.
- **`GET /marketing/summary` always returns fully-keyed count dicts** (every known stage/status value present, zero-filled) — confirmed `MarketingSummaryWidget` never needs a defensive `?? 0` when reading a specific key.
- **No org-wide content/video list endpoint exists** — `GET /content/`/`GET /videos/` both require a `campaign_id` query param. The Media Centre page's approved-source pickers are therefore built by fetching every campaign's own content/video and filtering to `status === "approved"` (§7) — a foundation-stage approach, not a request for a new backend endpoint.
- **No department-scoping exists on `Campaign`/`ContentPiece`/`VideoAsset`/`MediaCentreItem`** — organisation-wide, the same trade-off Package J's `CrmContact` already made. A "marketing"-function department's dashboard shows the same organisation-wide `marketingSummary` object any other department would.

None of these findings required backend changes from this side.

## 3. Head of Marketing retrofit; Content Producer, Video Producer (requirements #1–#4)

No dedicated frontend surface was built for the Head of Marketing retrofit itself — per the confirmed design decision, Marketing Manager Worker's existing catalogue entry is unchanged in scope; this package's campaign/dashboard mechanics (§4, §8) are what it now operates through. Video Producer Worker (`docs/workforce/VIDEO_PRODUCER_WORKER.md`, new) has no dedicated frontend surface either — like every worker in this catalogue, it's created via the existing Workers screens (Package 3). `CampaignForm`'s and `ContentPiecePanel`/`VideoAssetPanel`'s worker pickers (§4) are the places this package's UI actually asks "which worker should act here" — any active worker can be selected, not just ones named for a specific tier.

## 4. Campaign management, content production, video production, the pipeline handoff (requirements #5, #6, #7, #12)

`CampaignForm` (creation) and `CampaignListView` (stage-filterable list, via `?stage=` query params on `/portal/marketing`) cover requirement #5. `ContentPiecePanel` and `VideoAssetPanel` on the campaign detail page cover #6/#7 — each has its own manual-submit form and, when active workers exist, a "Draft with AI" affordance. `VideoAssetPanel`'s source-content dropdown (populated from `approvedContentPieces`, computed in the campaign detail page from `content.value.filter(p => p.status === 'approved')`) is the concrete UI realisation of requirement #12's pipeline handoff — selecting an approved content piece there is what makes the AI-drafted script actually read that content's own text.

## 5. Content approval workflows and the originated governance rule (requirement #10, governance)

`ContentPiecePanel` and `VideoAssetPanel` are two separate components (not one shared `DealDocumentPanel`-style component) since content's `brief`/`content` fields and video's `content_piece_id` picker don't share enough shape to make a single parametrised component cleaner than two — a deliberate departure from Package J's precedent where the three deal-document kinds genuinely were near-identical. Approve/reject buttons in both panels, and the "Mark Published" button in `MediaCentreView`, only render for `useAuth().user.role === 'admin'` — a presentation-layer convenience; the real enforcement is the backend's `require_role("admin")` on every `/decide` endpoint and on `/media-centre/{id}/mark-published`, verified live (§9) to hold even when called directly through this frontend's own BFF routes by a `member`.

## 6. Media Centre foundation (requirement #8)

`MediaCentreView` is the one new component for this: a publish form (kind selector, an approved-source picker scoped to the selected kind, a title field) plus a list of existing items with an admin-only "Mark Published" action. The `/portal/media-centre` page aggregates approved content/video across every campaign (§2) since no org-wide list endpoint exists — logged explicitly in its own file comment as a foundation-stage approach, not a silent workaround.

## 7. YouTube integration abstraction layer (requirement #9)

No dedicated frontend surface was built for this — per the confirmed design decision, the YouTube connector abstraction is cosmetic and backend-only (mirroring Package 8's/Package J's Connectors precedent). Consistent with Package J's own choice not to build a CRM-connectors page absent a specific objective calling for one, this package does not add a YouTube-connectors page either.

## 8. Executive marketing dashboards; CTO dashboard visibility; Executive Organisation integration (requirements #11, #14, #15)

`MarketingSummaryWidget` is one component rendering campaign-stage counts, pending content/video counts, and Media Centre ready/published counts from a single `fetchMarketingSummary()` response. `DepartmentDashboard.js` (Package I/J, extended) renders it when `department.function === "marketing"`, alongside its existing sales/customer-success branches — `null`-function departments show none of the three, fully additive. `/portal/cto` (extended) fetches the same summary via the identical per-section-resilience `Promise.allSettled` pattern (ADR-008) already used there for the worker list and execution history, and renders the widget in its own section — this is objective #15's CTO-dashboard visibility at dashboard-widget depth, not woven into the CTO chain's own Ollama synthesis context, the same integration depth Package J gave CRM pipeline data. **Verified live (§9):** both `/portal/departments/:marketingDeptId` and `/portal/cto` rendered the widget's own heading text from real data.

## 9. Validation

Run from a clean state (`rm -rf .next`):

```
$ npm run build   → ✓ Compiled successfully, all new routes listed
                     (/portal/marketing, /portal/marketing/[campaignId],
                     /portal/media-centre, and 12 new /api/portal/*
                     BFF routes), no errors
$ npm run lint    → ✔ No ESLint warnings or errors
$ npm test        → ℹ tests 204, pass 204, fail 0
```

### Unit tests (204 total; 27 new for this package)

New: `lib/api/__tests__/{marketing,marketingProduction,mediaCentre}.test.js`, plus 7 new cases across `lib/api/__tests__/validation.test.js` for the five new parsers, and one existing `parseDepartmentFunctionPayload` test case updated to reflect `"marketing"` now being a valid value rather than rejected. All 177 tests from Packages 1–9/G/H/I/J pass unchanged.

### End-to-end smoke test (real backend, real Ollama — not mocked)

A temporary `teracom-ai-backend` instance (port 8001) and this frontend (port 3001) were started against the real dev Postgres and the genuinely-running local Ollama instance. A Marketing department (`function = "marketing"`) with three workers assigned, and a full campaign lifecycle (campaign created → AI-drafted-and-approved content → AI-drafted-and-approved video script informed by that approved content → published to the Media Centre → marked published → campaign completed) were exercised as both an admin and a `member` user.

| Check | Result |
|---|---|
| `GET /portal/marketing` | `200`; the test campaign and its stage rendered from real data |
| `GET /portal/marketing/:campaignId` | rendered (fetched as part of the campaign detail flow) |
| `GET /portal/media-centre` | `200`; the published video's title rendered |
| `GET /portal/departments/:marketingDeptId` | `200`; "Campaign & production pipeline" widget rendered |
| `GET /portal/cto` | `200`; the same widget rendered again, alongside the existing CTO panel/history |
| Member → BFF `POST /api/portal/content` (submit) | `200` — any org member may submit |
| Member → BFF `POST /api/portal/content/:id/decide` | `403` — the governance gate holds through the full BFF stack, not just the direct backend API |

All verification data was deleted from the real dev database afterward (see backend report §9 for the full cleanup); both temporary servers were stopped — the `next-server` child required an explicit `kill -9` after `pkill -f "next start"` only killed the wrapper, the same known quirk from prior packages — and confirmed down via a follow-up `curl` against both ports.

---

## 10. Files changed

### New files

```
lib/api/marketing.js                                            campaign CRUD/stage + fetchMarketingSummary
lib/api/marketingProduction.js                                  content/video submit/decide/draft (one file, not two)
lib/api/mediaCentre.js                                          publish/mark-published/list
lib/api/__tests__/{marketing,marketingProduction,mediaCentre}.test.js   unit tests

app/api/portal/campaigns/route.js                               POST → createCampaign() BFF proxy
app/api/portal/campaigns/[campaignId]/stage/route.js             PATCH → updateCampaignStage() BFF proxy
app/api/portal/content/route.js                                  POST → submitContent() BFF proxy
app/api/portal/content/draft/route.js                            POST → draftContent() BFF proxy
app/api/portal/content/[contentPieceId]/submit/route.js          POST → submitDraftedContent() BFF proxy
app/api/portal/content/[contentPieceId]/decide/route.js          POST → decideContent() BFF proxy
app/api/portal/videos/route.js                                   POST → submitVideo() BFF proxy
app/api/portal/videos/draft-script/route.js                      POST → draftScript() BFF proxy
app/api/portal/videos/[videoAssetId]/submit/route.js              POST → submitDraftedVideo() BFF proxy
app/api/portal/videos/[videoAssetId]/decide/route.js              POST → decideVideo() BFF proxy
app/api/portal/media-centre/publish/route.js                     POST → publishMediaItem() BFF proxy
app/api/portal/media-centre/[itemId]/mark-published/route.js     POST → markMediaItemPublished() BFF proxy

app/portal/(protected)/marketing/{page,loading,error}.js         Marketing Manager workspace
app/portal/(protected)/marketing/[campaignId]/{page,loading,error}.js   campaign detail
app/portal/(protected)/media-centre/{page,loading,error}.js      Media Centre foundation workspace

components/portal/CampaignForm.js                                campaign creation (client)
components/portal/CampaignListView.js                            stage-filterable campaign list (server)
components/portal/CampaignDetail.js                               stage control (client)
components/portal/ContentPiecePanel.js                            content production panel (client)
components/portal/VideoAssetPanel.js                              video production panel (client)
components/portal/MediaCentreView.js                              Media Centre publish/list/mark-published (client)
components/portal/MarketingSummaryWidget.js                       marketing summary widget (server)

docs/workforce/VIDEO_PRODUCER_WORKER.md                          new catalogue entry

docs/backend/PHASE_0_PACKAGE_K_MARKETING_AND_MEDIA_IMPLEMENTATION_REPORT.md   backend report
docs/frontend/IMPLEMENTATION_REPORTS/MARKETING_AND_MEDIA_IMPLEMENTATION_REPORT.md   this file
```

### Modified files

| File | Change | Reason |
|---|---|---|
| `lib/api/validation.js` | Added 5 new parsers (campaign, campaign stage, marketing production, marketing draft, media publish); extended `DEPARTMENT_FUNCTIONS` to include `"marketing"` | Requirements #5–#8, #14 |
| `lib/api/__tests__/validation.test.js` | New test cases for the above; updated the existing `parseDepartmentFunctionPayload` test to reflect `"marketing"` now being valid | Test coverage |
| `components/portal/DepartmentFunctionControl.js` | Added a `"marketing"` `<option>` | Requirement #14 |
| `components/portal/DepartmentDashboard.js` | Conditionally renders `MarketingSummaryWidget` when `department.function === "marketing"` | Requirements #11/#14 |
| `components/portal/PortalNav.js` | New "Marketing"/"Media Centre" top-level links | First-class workspaces, same standard Package I/J's link set |
| `app/portal/(protected)/departments/[departmentId]/page.js` | Fetches `marketingSummary`, passes it to `DepartmentDashboard` | Requirement #11 |
| `app/portal/(protected)/cto/page.js` | Fetches `marketingSummary`, renders `MarketingSummaryWidget` in its own section | Requirement #15 |
| `docs/workforce/MARKETING_MANAGER_WORKER.md` | New note on the Package K retrofit, without changing existing scope | Requirement #1 |
| `docs/workforce/WORKER_CATALOGUE.md` | Table extended to 18 types; new note on Video Producer's three-tier relationship | Requirements #2–#4 |
| `docs/governance/ARCHITECTURE_DECISIONS.md` | New ADR-015 | Governance |

No file from Packages 1–9/G/H/I/J was changed in behaviour beyond the `DepartmentDashboard`/`DepartmentFunctionControl`/`PortalNav`/department-page/CTO-page additions above — every other pre-existing component, page, and `lib/api/*` module is reused exactly as it was.

---

## 11. Remaining risks / follow-ups

1. **No department-scoping exists on `Campaign`/`ContentPiece`/`VideoAsset`/`MediaCentreItem`.** A "marketing"-function department's dashboard shows the same organisation-wide summary data any other department would — not a per-department pipeline. Same deliberate simplicity choice Package J made for `CrmContact`.
2. **No campaign, content piece, video asset, or Media Centre item can ever be corrected or removed once created** — the same standing limitation carried from Package 6/H/J, now present on this package's four new entities too, not compounded in severity.
3. **`Department.function = "marketing"` is not wired into CTO Orchestration's delegation routing** — same standing gap already flagged for `"sales"`/`"customer_success"` in Package J's own report.
4. **The Media Centre's approved-source pickers are built by fetching every campaign's own content/video and filtering client-side** — acceptable at foundation scale, but would need a real org-wide list endpoint if the number of campaigns grows large.
5. **All risks carried over from Packages 1–9/G/H/I/J remain unchanged** — see the respective prior reports.

## 12. Recommended next package

All four most recent reports (Packages H, I, J, K) converge on the same standing gap: a real update/delete (or explicit archive) capability, now spanning twelve distinct rows across memory, sales/customer-success, and marketing/media data models. A second, recurring candidate: wiring `Department.function` (now three values — `"sales"`, `"customer_success"`, `"marketing"`) into CTO Orchestration's own delegation heuristic, a gap flagged identically in three consecutive packages' reports.

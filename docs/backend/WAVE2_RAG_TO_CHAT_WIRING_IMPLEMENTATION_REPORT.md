# Wave 2, Workstream 1 — RAG-to-Chat Wiring — Implementation Report

**Date:** 2026-08-19 · **Repo:** `teracom-ai-backend` (all code changes); `teracom-ai-frontend` (governance docs only — no frontend change needed). **Source:** `WAVE2_IMPLEMENTATION_PLAN.md` (`teracom-ai-docs`) §1, itself derived from `MASTER_RECOMMENDATION.md`'s own 30-day plan and `KNOW1_ASSESSMENT.md`'s original finding. **Scope:** connect the already-real semantic search service to Worker chat's context assembly — no new service or schema required.

---

## 1. Root cause, confirmed by direct code reading before any change was made

`services/worker_retrieval_service.py#get_worker_context()` queried every `Knowledge` row a worker had a `KnowledgePermission` for and joined the **full `.content`** of each — no query relevance, no chunking, no top-K limit, no size cap. Real semantic search already existed and worked correctly (`services/rag_service.py#retrieve_context()`, using genuine Chroma vector search over sentence-transformer embeddings), but was only ever called from the standalone `/search` endpoint — never from the chat path.

Two findings from investigation shaped the fix's design:
- **`build_context()` has 8 real call sites**, not just chat: proposal drafting, orchestration consultation (twice), video scripting, CTO delegation (twice), and content drafting, and federation consultation — none of the other 7 have a natural chat-style message to embed.
- **Chroma's stored metadata scopes only by `organisation_id`, never by worker permission.** A naive reuse of `retrieve_context()` in chat would leak semantically-relevant documents the requesting worker has no `KnowledgePermission` for.

---

## 2. What was implemented

- `config.py` — two new settings: `CHAT_CONTEXT_TOP_K` (default 5) and `CHAT_CONTEXT_MAX_CHARS` (default 8000).
- `services/worker_retrieval_service.py#get_worker_context()` — gained an optional `query: str | None = None` parameter.
  - When `query` is `None` (every call site except chat), behaviour is **byte-for-byte identical** to before this change: full concatenation of every permitted document.
  - When `query` is supplied, candidates are fetched via `retrieve_context()` (over-fetched at 4× `CHAT_CONTEXT_TOP_K`, minimum 20, to compensate for Chroma's organisation-only scoping), then filtered down to only documents the requesting worker holds a `KnowledgePermission` for, then capped to `CHAT_CONTEXT_TOP_K` and `CHAT_CONTEXT_MAX_CHARS` (with a truncation marker if exceeded).
  - If no permitted candidate survives the filter, falls back to full concatenation rather than returning empty context.
- `services/context_builder.py#build_context()` — gained the same optional `query` parameter, threaded straight through to `get_worker_context()`.
- `api/chat.py` — the only call site updated to pass `query=request.message`. The other 7 call sites are unchanged.

---

## 3. Tests

New file `tests/test_rag_chat_wiring.py`, 6 tests:
- `test_get_worker_context_without_a_query_preserves_full_concatenation` — confirms the `None`-query default path is unchanged.
- `test_get_worker_context_with_a_query_never_includes_an_unpermitted_document` — the single most important correctness property: two near-identical documents, only one permitted; the unpermitted one (deliberately the more semantically relevant of the two) never appears.
- `test_get_worker_context_with_a_query_does_not_include_every_permitted_document` — creates more documents than `CHAT_CONTEXT_TOP_K`, confirms the returned context includes at most that many, not all of them.
- `test_get_worker_context_with_a_query_truncates_to_the_character_cap` — a deliberately oversized single document, confirms the hard character cap and truncation marker.
- `test_get_worker_context_falls_back_to_full_concatenation_when_semantic_search_misses` — `retrieve_context` is patched to return only non-permitted candidate ids, deterministically exercising the fallback branch regardless of real embedding behaviour.
- `test_chat_endpoint_produces_a_real_response_using_the_wired_semantic_context` — one real, full-pipeline `POST /chat/` call with a real Ollama response, matching this suite's own established pattern (e.g. `test_cto_orchestration.py`) of proving a real end-to-end call works, not only its individually-mocked pieces.

---

## 4. Validation

- **Backend:** full suite — 283/283 passing (277 before this workstream, +6 new). Zero regressions — specifically confirms the other 7 `build_context()` call sites (proposal, orchestration ×2, video, cto ×2, content, federation) are unaffected.
- **Frontend:** 302/302 passing, unaffected — no frontend code changed.

---

## 5. What was deliberately not done

- **No chunking.** Each Knowledge document remains a single Chroma entry. The fix bounds context by document count and total characters, which is a real, meaningful improvement, but a single very long permitted document can still consume a large share of the character budget alone. Chunking-based retrieval is a larger, separate piece of work.
- **No Chroma metadata schema change.** Worker-permission scoping is enforced by post-filtering at query time, not by re-indexing every document with worker-level metadata — the smaller, sufficient fix given the current document/permission volumes.

---

## 6. Commit status

Backend and frontend (governance docs) changes complete and tested, ready to commit locally. **Not pushed** — per instruction ("Commit locally... Do not push").

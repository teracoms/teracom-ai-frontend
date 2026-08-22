# backgrounds/

Destination folder for hero background images (`teracom-ai-docs/IMAGE_IMPLEMENTATION_PLAN_V1.md`, `FRONTEND_IMAGE_IMPLEMENTATION_V1.md`).

**Empty today, deliberately.** Image Pack V1 has been fully reviewed and selected across all ten categories, including a regenerated Dashboard and Digital Workforce (both passed clean against the approved deep blue/indigo/teal/electric cyan/gold palette) — see `IMAGE_IMPLEMENTATION_PLAN_V1.md` §8 for the full approval. The one remaining step is mechanical: the twenty selected source files (16 JPG at 1920×1080, 4 PNG at 3840×2160) are staged but not yet converted to the WebP files this folder should actually hold (`IMAGE_IMPLEMENTATION_PLAN_V1.md` §9, Step 1).

Once that conversion runs, this folder should contain exactly:

```
login-bg.webp
login-bg-alt.webp
dashboard-bg.webp
dashboard-bg-alt.webp
org-setup-bg.webp
org-setup-bg-alt.webp
executive-bg.webp
executive-bg-alt.webp
workforce-bg.webp
workforce-bg-alt.webp
knowledge-bg.webp
knowledge-bg-alt.webp
memory-bg.webp
memory-bg-alt.webp
governance-bg.webp
governance-bg-alt.webp
platform-admin-bg.webp
platform-admin-bg-alt.webp
reporting-bg.webp
reporting-bg-alt.webp
```

Do not add files here directly from the unoptimised staging copies at `/tmp/.../image-pack-staged/production/` — those are JPG/PNG, not WebP, and have not been through the optimisation step `IMAGE_IMPLEMENTATION_PLAN_V1.md` §9 Step 1 specifies.

# backgrounds/

Destination folder for hero background images (`teracom-ai-docs/IMAGE_IMPLEMENTATION_PLAN_V1.md`, `FRONTEND_IMAGE_IMPLEMENTATION_V1.md`).

**Empty today, deliberately.** Image Pack V1 (30 source JPGs, `/home/robert/teracom-assets/visual-identity-v1/`) has been reviewed and a production set selected — see `IMAGE_IMPLEMENTATION_PLAN_V1.md` for the full review — but the selected images are currently:
1. Off-palette (blue/gold, not this product's established near-black/red — a real brand decision, not yet made), and
2. Unoptimised source JPGs at 1920×1080 (~250–330KB each), not yet converted to the WebP files this folder should actually hold.

Neither of those is a "planning" decision — both need to be resolved (palette direction confirmed, then `sharp`/`cwebp` conversion run) before real files land here. Once they do, this folder should contain exactly:

```
login-bg.webp
dashboard-bg.webp          (no source image exists yet — see the plan doc)
org-setup-bg.webp
executive-bg.webp
workforce-bg.webp          (no rule-compliant source image exists yet — see the plan doc)
knowledge-bg.webp
memory-bg.webp
governance-bg.webp
platform-admin-bg.webp
reporting-bg.webp
```

Do not add files here directly from the unoptimised staging copies at `/tmp/.../image-pack-staged/production/` — those are JPG, not WebP, and have not been through the optimisation step `IMAGE_IMPLEMENTATION_PLAN_V1.md` §6 specifies.

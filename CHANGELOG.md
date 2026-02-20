Changelog (workspace-coder)

2026-02-20 - Iteration
- feat: Added shared/modelAdapter.ts — normalize fragment model shapes to a stable adapter API
- feat: Added shared/raycastHelper.ts — unified selection/raycast helper; prefers FragmentsManager raycast when available and falls back to Three.js raycasting with BVH awareness
- fix: Replaced nondeterministic polygonOffsetFactor with deterministic offset to avoid visual nondeterminism
- chore: Added local minimal worker fallbacks at bim-fragment-viewer/resources/worker.mjs and projects/bim-mobile-viewer/resources/worker.mjs
- test: Added scripts/smoke-test.js (Puppeteer-based smoke test) and scripts/serve-dist.js (simple static server)
- refactor: Desktop viewer wired to shared helpers; showProperties/highlight flows use adaptModel

Notes
- Desktop viewer builds and smoke test passed when served over HTTP (localhost). Some GL driver warnings observed at runtime.
- Mobile viewer build failing due to TypeScript typing mismatches and shared helper import resolution; coder agent spawned to continue.

TODO (next release)
- Vendor ThatOpen worker and pin version
- Add adaptModel unit tests
- Fix mobile TypeScript issues and complete mobile build + smoke test
- Reduce bundle sizes by dynamic-importing heavy libs (ThatOpen, three, fragments)

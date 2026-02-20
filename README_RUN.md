How to run the BIM Fragment Viewer workspace (developer guide)

Prerequisites
- Node.js 22+ and npm or pnpm
- Recommended: Chrome for Puppeteer

Desktop viewer (build + serve + smoke test)
1. Build desktop viewer
   cd bim-fragment-viewer
   npm ci
   npm run build

2. Serve built dist
   node scripts/serve-dist.js 8080 ./dist
   Open http://localhost:8080 in a browser to inspect.

3. Run smoke test (headless)
   cd ..
   npm install puppeteer --no-audit --no-fund
   SMOKE_URL=http://localhost:8080/index.html node scripts/smoke-test.js

Notes
- The smoke test uses Puppeteer to open the page, wait for load, click the viewer, and gather console logs.
- If using file:// URLs the browser will block some resources; serve over HTTP.

Mobile viewer (build issues)
- The mobile viewer (projects/bim-mobile-viewer) currently fails TypeScript build due to two classes of issues:
  - Type mismatches: ThatOpen types (FragmentsManager) are narrower than runtime usage (highlight, group properties). We currently use (fragments as any).highlight in the desktop example; mobile still needs similar casts.
  - Shared helper import path and three type resolution: the shared raycast helper imports 'three' dynamically, but TypeScript checks the shared file during the mobile build and requires @types/three. Options:
    - Install @types/three in the mobile project
    - Convert shared helper to use only runtime 'require' without Three type annotations (done partially)

Recommended quick fix for mobile build (worked example)
- Use pnpm install (we used pnpm successfully) or npm install --legacy-peer-deps in projects/bim-mobile-viewer.
- Adjust code to cast fragments to any when calling highlight, and avoid referencing non-existent modelId on selection result.

Longer term
- Vendor the official ThatOpen worker.mjs into resources/ and pin a version.
- Add unit tests for adaptModel (fast Node tests).
- Split large bundles (ThatOpen + three) via dynamic import to reduce gzipped chunk size.

Contact
- Architect: run /status to get runtime info.

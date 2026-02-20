# CI/CD Notes

This document describes how to run the CI checks locally.

## Prerequisites

- Node.js 18+ (Node 20 recommended)
- pnpm (for mobile viewer)

## Running Locally

### 1. Install Dependencies

At workspace root:
```bash
npm install
```

### 2. Build Desktop Viewer (bim-fragment-viewer)

```bash
cd bim-fragment-viewer
npm ci
npm run build
cd ..
```

### 3. Build Mobile Viewer

```bash
cd projects/bim-mobile-viewer
pnpm install
pnpm run build
cd ../..
```

### 4. Run Unit Tests

```bash
npx vitest run
```

Or run in watch mode during development:
```bash
npx vitest
```

### 5. Run Smoke Tests

First, start the static server:
```bash
node scripts/serve-dist.js 8080 bim-fragment-viewer/dist
```

Then in another terminal, run the smoke tests:
```bash
SMOKE_URL=http://localhost:8080 node scripts/smoke-test.js
```

Or use the default file:// URL:
```bash
node scripts/smoke-test.js
```

## GitHub Actions

The CI workflow runs on push/PR to `main` branch:

1. Checkout code
2. Setup Node.js 20
3. Cache and install dependencies
4. Build desktop viewer
5. Build mobile viewer
6. Run unit tests (vitest)
7. Run smoke tests (headless browser)

Smoke tests are allowed to fail (`continue-on-error: true`) as they can be flaky in CI environments.

## Test Configuration

- **Test runner**: Vitest
- **Environment**: jsdom
- **Test location**: `test/shared/modelAdapter.spec.ts`
- **Setup file**: `test/setup.ts` (collects console logs)

## Troubleshooting

### Port already in use
Change the port in the serve-dist command:
```bash
node scripts/serve-dist.js 3000 bim-fragment-viewer/dist
```

### Puppeteer issues
Smoke tests use Puppeteer which may need additional dependencies in CI. The workflow uses `--no-sandbox` flag for compatibility.

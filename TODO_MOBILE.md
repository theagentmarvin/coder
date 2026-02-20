Mobile viewer build issues (diagnosis & actions)

Symptoms
- projects/bim-mobile-viewer build fails under pnpm/npm run build with TypeScript errors:
  - Property 'highlight' does not exist on FragmentsManager type.
  - result.modelId is referenced but not present on selection result type.
  - Shared helper file imports 'three' dynamically but TypeScript still checks it and complains about missing @types/three.

Root causes
1. Type mismatch between ThatOpen runtime API and TypeScript declaration files for the mobile project's ThatOpen packages.
2. Shared helper uses dynamic imports and runtime requires; TypeScript will still type-check the file and needs types available or code converted to pure runtime JS (no three type references).

Immediate actions (small, quick)
- In mobile viewer code:
  - Avoid referencing result.modelId; use the loadedModels map keys instead.
  - Cast fragments to any when calling highlight: (fragments as any).highlight(...)
  - Adjust import path to shared helper if needed.
- In shared helper:
  - Remove all type-only references to three and use runtime dynamic import/require.
  - Ensure the file compiles under the mobile project's tsconfig (no top-level type import from 'three').

Longer actions
- Add @types/three to mobile project devDependencies (if safe) or convert shared helper to a pure JS module (no TS types) and import it from TS as any.
- Add unit tests and CI job to catch these type drift issues early.

Work plan for coder agent
- Make minimal code edits to silence TS errors (casts, remove modelId) and re-run pnpm build.
- If still blocked, either add @types/three to mobile project or move shared helper into a small JS file (no TS) and import it.

Decision requested
- Prefer adding @types/three as devDependency, or make shared helper JS-only? (devDependency is straightforward but adds types to mobile project.)

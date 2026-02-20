# TOOLS.md - BIM Coder Local Notes

## Tech Stack

- **3D/BIM:** @thatopen/components, @thatopen/ui, @thatopen/fragments
- **Speckle:** @speckle/viewer, Speckle Server GraphQL API
- **Bundler:** Vite
- **Package Manager:** pnpm
- **Language:** TypeScript (strict)
- **3D Engine:** Three.js (via That Open — match their version!)
- **Deploy:** Docker / Vercel / Netlify (TBD per project)

## Reference Docs (LOCAL — read these before coding!)

- `~/projects/bim/docs/thatopen/README.md` — Package overview, install commands, core concepts
- `~/projects/bim/docs/thatopen/hello-world.md` — Minimal app setup with World, Fragments, UI
- `~/projects/bim/docs/thatopen/creating-components.md` — Custom component pattern
- Online docs: https://docs.thatopen.com

## Project Directory

All projects: ~/projects/bim/

## Conventions

- Always `read` the relevant doc file before starting a new feature
- Use Vite for bundling (exclude web-ifc from optimizeDeps)
- Components are singletons — use `components.get()`, never `new`
- Always implement `Disposable` for memory cleanup
- Keep UI separate from component logic

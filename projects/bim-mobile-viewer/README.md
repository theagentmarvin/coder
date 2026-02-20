# BIM Mobile Viewer

A mobile-friendly BIM (Building Information Modeling) viewer built with That Open Components.

## Status: ✅ WORKING

**Version**: 2.4.4  
**Last Updated**: 2026-02-16

## Features

- Load and view BIM models in Fragment format
- Optimized for mobile devices with touch-friendly controls
- Export fragment models
- Dispose individual or all models
- Performance monitoring with Stats.js
- Responsive UI with @thatopen/ui

## Tech Stack

- **@thatopen/components**: 2.4.4
- **@thatopen/fragments**: 2.4.0
- **@thatopen/ui**: 2.4.0
- **Three.js**: 0.160.0
- **Vite**: 5.4.21
- **TypeScript**: 5.9.3

## Key Fix: FragmentsManager Initialization

The error `fragments.init is not a function` was resolved by using the correct v2.4.x API:

```typescript
// ❌ WRONG (v3.x API)
const fragments = components.get(OBC.FragmentsManager);
fragments.init(workerUrl);  // init() doesn't exist in v2.4.x

// ✅ CORRECT (v2.4.x API)
const fragments = components.get(OBC.FragmentsManager);
// No init() needed - load directly
const group = fragments.load(data, { name: modelId, coordinate: true });
```

## Sample Models

The viewer loads sample BIM models from That Open's demo repository:
- `school_arq.frag` - Architectural model
- `school_str.frag` - Structural model

## Development

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm run dev

# Build for production
pnpm run build
```

## Live Demo

🌐 **https://theagentmarvin.github.io/my-visualizations/projects/bim-mobile-viewer/**

## API Notes

### FragmentsManager v2.4.x

| Method | Description |
|--------|-------------|
| `load(data, config)` | Load a fragment binary file |
| `export(group)` | Export a fragment group to binary |
| `disposeGroup(group)` | Remove a model from the scene |
| `groups` | DataMap of all loaded fragment groups |
| `list` | DataMap of all loaded fragments |

### Events

- `onFragmentsLoaded` - Fired when fragments are loaded
- `onFragmentsDisposed` - Fired when fragments are disposed
- `groups.onItemSet` - Fired when a group is added
- `groups.onItemDeleted` - Fired when a group is removed

## Console Status

✅ No errors  
✅ Models load and render correctly  
✅ Camera controls work  
✅ UI buttons functional  
✅ Performance stats visible

## Troubleshooting

If you encounter `fragments.init is not a function`:
1. Check your @thatopen/components version
2. v2.4.x does NOT require `init()` - load directly with `fragments.load()`
3. v3.x requires `init(workerUrl)` before loading

## License

MIT

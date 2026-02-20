# BIM Fragment Viewer

A web-based BIM viewer built with ThatOpen Engine Components, featuring fragment-based IFC loading, element selection, property inspection, and search functionality.

## Features

- **3D IFC Viewer** - Load and visualize IFC models using fragment-based geometry
- **Click to Select** - Click on any element in the 3D view to see its properties
- **Property Panel** - View detailed element properties including name, type, and property sets
- **Search Functionality** - Search for elements by name or type using ItemsFinder
- **Live Logs** - Real-time console output displayed in the UI
- **Performance Stats** - FPS counter for monitoring performance

## Tech Stack

- **ThatOpen Components** - Core BIM functionality (@thatopen/components v3.3.2)
- **ThatOpen Fragments** - Geometry optimization (@thatopen/fragments v3.3.4)
- **ThatOpen UI** - UI toolkit (@thatopen/ui v3.3.3)
- **Three.js** - 3D rendering (v0.182.0)
- **Web-IFC** - IFC parsing engine (v0.0.75)
- **Vite** - Build tooling
- **TypeScript** - Type-safe development

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. **Load an IFC file** - Use the file input to load your own IFC files, or click "Load Sample IFC" to test with a sample model
2. **Navigate** - Use mouse to orbit, zoom, and pan around the model
3. **Select elements** - Click on any element in the 3D view to see its properties
4. **Search** - Type in the search box to find elements by name or type
5. **View results** - Click on search results to highlight and view specific elements

## Architecture

The application follows the ThatOpen Components architecture:

- **World** - Contains scene, camera, and renderer
- **FragmentsManager** - Manages fragment-based geometry
- **IfcLoader** - Handles IFC file parsing and loading
- **ItemsFinder** - Provides search functionality across model elements
- **Raycasters** - Handles 3D picking for element selection
- **Highlighter** - Manages visual highlighting of selected elements

## License

MIT

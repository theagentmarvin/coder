# Development References

Quick access to documentation for BIM, 3D, data visualization, and web development.

---

## BIM & 3D Libraries

### That Open (IFC.js successor)
Official documentation and resources for the modern IFC.js ecosystem.

- **Main Docs**: https://docs.thatopen.com/
- **Components Repository**: https://github.com/ThatOpen/engine_components
- **Examples**: https://github.com/ThatOpen/engine_components/tree/main/examples
- **UI Components**: https://github.com/ThatOpen/engine_ui_components

**Key Concepts:**
- Components architecture (modular BIM tools)
- IFC loading and parsing
- Fragment management (geometry optimization)
- Property extraction and filtering
- 2D plan generation

**Quick Start:**
```bash
npm install @thatopen/components @thatopen/components-front @thatopen/ui three
```

---

### Speckle
Data platform and viewer for AEC collaboration.

- **Viewer API Docs**: https://speckle.guide/dev/viewer-api.html
- **Main Repository**: https://github.com/specklesystems/speckle-server
- **Viewer Sandbox**: https://speckle.systems/viewer-sandbox/
- **Community Forum**: https://speckle.community/
- **API Reference**: https://speckle.guide/dev/server-api.html

**Key Concepts:**
- Streams and commits (version control for BIM data)
- Object loader (geometry fetching)
- Viewer extensions (custom functionality)
- Real-time collaboration (WebSockets)
- Authentication and permissions

**Quick Start:**
```bash
npm install @speckle/viewer
```

---

### Three.js
WebGL 3D library powering most BIM viewers.

- **Official Docs**: https://threejs.org/docs/
- **Examples Gallery**: https://threejs.org/examples/
- **Manual**: https://threejs.org/manual/
- **Journey Course**: https://threejs-journey.com/ (excellent learning resource)
- **Fundamentals**: https://threejs.org/manual/#en/fundamentals

**Key Concepts:**
- Scene, Camera, Renderer (core trinity)
- Geometries and Materials
- Lights and Shadows
- OrbitControls (camera navigation)
- Raycasting (object selection)
- BufferGeometry (performance)
- Groups and Object3D hierarchy

**Common Patterns:**
```javascript
// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// OrbitControls
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
const controls = new OrbitControls(camera, renderer.domElement);

// Raycasting for selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
// Update mouse coords on click, then:
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(scene.children, true);
```

---

### Web-IFC
Low-level IFC parser (used by That Open Components).

- **Repository**: https://github.com/tomvandig/web-ifc
- **npm Package**: https://www.npmjs.com/package/web-ifc
- **IFC Schema**: https://standards.buildingsmart.org/IFC/RELEASE/IFC4/ADD2_TC1/HTML/

**Usage:**
```javascript
import { IfcAPI } from 'web-ifc';
const ifcApi = new IfcAPI();
await ifcApi.Init();
const modelID = ifcApi.OpenModel(data);
const props = ifcApi.GetLine(modelID, expressID);
```

---

## Data Visualization

### Chart.js
Simple yet flexible JavaScript charting library.

- **Official Docs**: https://www.chartjs.org/docs/latest/
- **Getting Started**: https://www.chartjs.org/docs/latest/getting-started/
- **Chart Types**: https://www.chartjs.org/docs/latest/charts/
- **Samples**: https://www.chartjs.org/docs/latest/samples/

**Quick Start:**
```bash
npm install chart.js
```

**Common Chart Types:**
- Line, Bar, Pie, Doughnut
- Scatter, Bubble, Radar
- Mixed types

---

### Plotly.js
Interactive, publication-quality graphs in JavaScript.

- **Documentation**: https://plotly.com/javascript/
- **Reference**: https://plotly.com/javascript/reference/
- **Examples**: https://plotly.com/javascript/

**Quick Start:**
```bash
npm install plotly.js-dist-min
```

**Advanced Features:**
- 3D plots (scatter, surface, mesh)
- Heatmaps and contours
- Statistical charts
- Animations
- Subplots

---

### D3.js
Low-level library for bespoke data visualizations.

- **Official Site**: https://d3js.org/
- **API Reference**: https://d3js.org/api
- **Observable Gallery**: https://observablehq.com/@d3/gallery
- **Learn D3**: https://observablehq.com/collection/@d3/learn-d3

**Quick Start:**
```bash
npm install d3
```

**Core Modules:**
- Selections (DOM manipulation)
- Scales (data → visual mapping)
- Axes and shapes
- Transitions (animations)
- Force simulations

---

## Web Development

### React
The most popular UI library for modern web apps.

- **Official Docs**: https://react.dev/
- **Learn React**: https://react.dev/learn
- **Hooks Reference**: https://react.dev/reference/react
- **API Reference**: https://react.dev/reference/react-dom

**Quick Start:**
```bash
npm create vite@latest my-app -- --template react
```

**Key Hooks:**
- `useState` - state management
- `useEffect` - side effects
- `useRef` - DOM references (important for Three.js canvas)
- `useMemo` - performance optimization
- `useCallback` - memoized functions

**Three.js + React Pattern:**
```javascript
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

function ThreeScene() {
  const canvasRef = useRef();
  
  useEffect(() => {
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current });
    // ... setup and animation loop
    
    return () => {
      // Cleanup
      renderer.dispose();
    };
  }, []);
  
  return <canvas ref={canvasRef} />;
}
```

---

### Vite
Next-generation frontend tooling (fast dev server, bundling).

- **Guide**: https://vitejs.dev/guide/
- **Config Reference**: https://vitejs.dev/config/
- **Plugins**: https://vitejs.dev/plugins/

**Quick Start:**
```bash
npm create vite@latest
```

**Why Vite:**
- Fast HMR (Hot Module Replacement)
- Optimized builds
- Built-in TypeScript support
- Easy configuration

---

### Tailwind CSS
Utility-first CSS framework for rapid UI development.

- **Documentation**: https://tailwindcss.com/docs
- **Installation**: https://tailwindcss.com/docs/installation
- **Components**: https://tailwindui.com/ (paid, but excellent)
- **Headless UI**: https://headlessui.com/ (free, accessible components)

**Quick Start:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Common Classes:**
```html
<!-- Flexbox layout -->
<div class="flex items-center justify-between p-4 bg-gray-100 rounded-lg shadow-md">
  <h2 class="text-xl font-bold text-gray-800">Title</h2>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click me
  </button>
</div>
```

---

### TypeScript
Typed superset of JavaScript for safer, more maintainable code.

- **Handbook**: https://www.typescriptlang.org/docs/handbook/
- **Cheat Sheets**: https://www.typescriptlang.org/cheatsheets
- **TSConfig Reference**: https://www.typescriptlang.org/tsconfig

**Quick Start:**
```bash
npm install -D typescript @types/react @types/node
npx tsc --init
```

**Common Types:**
```typescript
// Interfaces for components
interface BIMViewerProps {
  modelUrl: string;
  onSelect?: (objectId: string) => void;
  showProperties?: boolean;
}

// Type for Three.js objects
type SelectableObject = THREE.Mesh | THREE.Group;
```

---

## Backend & APIs

### Node.js & Express
Server-side JavaScript runtime and web framework.

- **Node.js Docs**: https://nodejs.org/en/docs/
- **Express Guide**: https://expressjs.com/en/guide/routing.html
- **API Reference**: https://expressjs.com/en/4x/api.html

**Quick Start:**
```bash
npm init -y
npm install express
```

**Basic Server:**
```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/models', (req, res) => {
  res.json({ models: [] });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

---

### Postgres & Prisma
Relational database and modern ORM.

- **Postgres Docs**: https://www.postgresql.org/docs/
- **Prisma Docs**: https://www.prisma.io/docs
- **Prisma Schema**: https://www.prisma.io/docs/concepts/components/prisma-schema

**Quick Start:**
```bash
npm install prisma @prisma/client
npx prisma init
```

**Schema Example:**
```prisma
model Project {
  id        String   @id @default(uuid())
  name      String
  ifcUrl    String?
  createdAt DateTime @default(now())
  models    Model[]
}

model Model {
  id        String  @id @default(uuid())
  name      String
  fileUrl   String
  projectId String
  project   Project @relation(fields: [projectId], references: [id])
}
```

---

## Deployment & DevOps

### GitHub Pages
Free static hosting for public repositories.

- **Quick Guide**: https://docs.github.com/en/pages/getting-started-with-github-pages
- **Custom Domains**: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- **GitHub Actions Deploy**: https://github.com/marketplace/actions/deploy-to-github-pages

**Deployment Pattern:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

### Vercel
Zero-config deployment for modern web apps.

- **Documentation**: https://vercel.com/docs
- **CLI**: https://vercel.com/docs/cli
- **Deployment**: https://vercel.com/docs/deployments/overview

**Quick Deploy:**
```bash
npm install -g vercel
vercel
```

---

### Docker
Containerization for consistent environments.

- **Get Started**: https://docs.docker.com/get-started/
- **Dockerfile Reference**: https://docs.docker.com/engine/reference/builder/
- **Compose**: https://docs.docker.com/compose/

**Example Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Package Management & Dependencies

### Common BIM/3D Stack
```json
{
  "dependencies": {
    "@thatopen/components": "^2.x",
    "@thatopen/components-front": "^2.x",
    "@thatopen/ui": "^2.x",
    "three": "^0.160.0",
    "web-ifc": "^0.0.51",
    "@speckle/viewer": "^2.x",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/three": "^0.160.0",
    "vite": "^5.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Common Visualization Stack
```json
{
  "dependencies": {
    "chart.js": "^4.4.0",
    "plotly.js-dist-min": "^2.27.0",
    "d3": "^7.8.0",
    "react-chartjs-2": "^5.2.0"
  }
}
```

---

## Quick Command Reference

### Development
```bash
# Create new React + Vite app
npm create vite@latest my-app -- --template react

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Git
```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit"

# Connect to remote
git remote add origin <url>
git push -u origin main

# Create feature branch
git checkout -b feature/new-tool
```

### Docker
```bash
# Build image
docker build -t my-app .

# Run container
docker run -p 3000:3000 my-app

# Docker Compose
docker-compose up -d
```

---

## Performance Optimization

### Three.js Performance Tips
- Use `BufferGeometry` instead of `Geometry`
- Implement frustum culling for large scenes
- Use instanced meshes for repeated objects
- Implement Level of Detail (LOD) for complex models
- Dispose geometries and materials when no longer needed
- Use texture compression (Basis Universal)
- Limit shadow-casting lights
- Use `renderer.shadowMap.autoUpdate = false` when shadows don't change

### React Performance Tips
- Use `React.memo()` for expensive components
- Implement `useMemo()` and `useCallback()` hooks
- Code splitting with `React.lazy()` and `Suspense`
- Virtualize long lists (react-window, react-virtualized)
- Avoid inline function definitions in JSX
- Use production builds for deployment

---

## Troubleshooting

### Common Three.js Issues
- **Black screen**: Check camera position and lighting
- **Texture not loading**: Verify CORS and path
- **Performance lag**: Check polygon count, use LOD
- **Memory leaks**: Dispose geometries/materials properly

### Common IFC.js Issues
- **IFC not loading**: Check file encoding (UTF-8)
- **Properties missing**: Verify IFC schema version
- **Slow parsing**: Use Web Workers, fragment optimization
- **Geometry not showing**: Check materials and visibility

### Common React Issues
- **State not updating**: Check immutability, use spread operators
- **Effect running infinitely**: Review dependency array
- **Props not passing**: Check component hierarchy
- **Canvas not rendering**: Ensure ref is attached correctly

---

**Last Updated**: 2026-02-16
**Maintained by**: Coder Agent (Kimi K2.5)

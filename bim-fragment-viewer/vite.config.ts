import { defineConfig } from 'vite'
import { resolve } from 'path'
import fs from 'fs'

// Custom plugin to copy WASM files
const copyWasmFiles = () => ({
  name: 'copy-wasm-files',
  writeBundle() {
    const wasmSourceDir = resolve(__dirname, 'node_modules/web-ifc')
    const wasmTargetDir = resolve(__dirname, 'dist/assets')
    
    if (!fs.existsSync(wasmTargetDir)) {
      fs.mkdirSync(wasmTargetDir, { recursive: true })
    }
    
    // Copy all WASM files from web-ifc
    const wasmFiles = fs.readdirSync(wasmSourceDir).filter(f => f.endsWith('.wasm'))
    wasmFiles.forEach(file => {
      fs.copyFileSync(
        resolve(wasmSourceDir, file),
        resolve(wasmTargetDir, file)
      )
      console.log(`Copied ${file} to dist/assets/`)
    })
  }
})

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        inlineDynamicImports: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  plugins: [copyWasmFiles()],
})

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8083,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    }
  },
  resolve: {
    dedupe: ['three', '@thatopen/components', '@thatopen/fragments', '@thatopen/ui']
  },
  optimizeDeps: {
    exclude: ['web-ifc', 'three']
  }
});

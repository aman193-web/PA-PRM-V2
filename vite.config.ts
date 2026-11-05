import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Two pages: the portals at / and the PRM Knowledge Hub at /hub/.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@hub': path.resolve(import.meta.dirname, './hub/src'),
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        hub: path.resolve(import.meta.dirname, 'hub/index.html'),
      },
    },
  },
})

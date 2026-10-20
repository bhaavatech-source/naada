import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Nāda will be served from the root of nada.medhaa.net.
  base: '/',
  plugins: [react()],
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html',
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'zustand'],
        },
      },
    },
  },
})

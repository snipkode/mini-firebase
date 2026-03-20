import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/auth': 'http://localhost:3000',
      '/db': 'http://localhost:3000',
      '/projects': 'http://localhost:3000'
    }
  },
  build: {
    outDir: '../api/public',
    emptyOutDir: true
  }
})

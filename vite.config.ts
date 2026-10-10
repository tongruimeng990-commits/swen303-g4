import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js and React Three Fiber live in the single immersive entry.
    chunkSizeWarningLimit: 1200,
  },
})

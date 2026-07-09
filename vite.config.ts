import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works at any URL (GitHub Pages serves
  // the app from /video-poker/ rather than the domain root)
  base: './',
})

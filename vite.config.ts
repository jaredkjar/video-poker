import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works at any URL (GitHub Pages serves
  // the app from /video-poker/ rather than the domain root)
  base: './',
  // App version from package.json, shown on the landing page
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})

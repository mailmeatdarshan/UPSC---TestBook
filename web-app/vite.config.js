import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // For GitHub Pages deployment, set base to the repository name
  // For Vercel, base should be '/' (default)
  base: process.env.GITHUB_PAGES ? '/TestBook/' : '/',
})

// SI-assisted (Claude), NASA Space Apps 2026
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { rmSync } from 'node:fs'
import { resolve } from 'node:path'

// The mock data under public/mock/ must never reach a published site.
// A normal build removes dist/mock; `npm run build:mock` keeps it (for previews only).
function dropMock(mode: string): Plugin {
  return {
    name: 'drop-mock-data',
    apply: 'build',
    closeBundle() {
      if (mode !== 'mock') rmSync(resolve(__dirname, 'dist/mock'), { recursive: true, force: true })
    },
  }
}

export default defineConfig(({ mode }) => ({
  // Relative base: the site works from any sub-path (GitHub Pages /<repo>/) without configuration.
  base: './',
  plugins: [react(), dropMock(mode)],
  define: {
    __ALLOW_MOCK__: JSON.stringify(mode !== 'production'),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1300,
  },
  server: { port: 5183, strictPort: true },
  preview: { port: 5184, strictPort: true },
}))

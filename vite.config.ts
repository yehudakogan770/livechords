import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves this as a project site at /<repo>/, not the domain root.
// vite's own HTML asset rewriting picks this up automatically, but
// vite-plugin-pwa uses explicit manifest fields (start_url, icons[].src)
// verbatim, so those need the prefix spelled out below.
const BASE_PATH = '/livechords/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'LiveChords — Hands-Free Chords & Lyrics',
        short_name: 'LiveChords',
        description:
          'Hands-free chord/lyrics display with tempo-synced auto-scroll, foot-pedal advance, and live auto-transpose for gigging musicians.',
        theme_color: '#0b0f14',
        background_color: '#0b0f14',
        display: 'standalone',
        orientation: 'any',
        start_url: BASE_PATH,
        scope: BASE_PATH,
        icons: [
          { src: `${BASE_PATH}icons/icon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: `${BASE_PATH}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE_PATH}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${BASE_PATH}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});

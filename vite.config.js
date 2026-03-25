import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  publicDir: 'public',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['data/templates.json', 'pwa-icon.svg'],
      manifest: {
        name: 'Narrative Lab',
        short_name: 'Narrative Lab',
        description: 'Planificación y escritura de libros en el navegador',
        theme_color: '#0c0e12',
        background_color: '#0c0e12',
        display: 'standalone',
        lang: 'es',
        start_url: './',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,json}'],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    include: ['assets/js/**/*.test.js'],
  },
});

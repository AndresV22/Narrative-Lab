import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  base: './',
  publicDir: 'public',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['data/templates.json', 'pwa-icon.svg'],
      manifest: {
        name: 'Rinconcito narrativo',
        short_name: 'Rinconcito narrativo',
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

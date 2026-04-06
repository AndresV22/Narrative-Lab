import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

/** GitHub Pages (proyecto): usa el nombre del repo, p. ej. VITE_BASE_PATH=/narrative-lab/ en CI. Local: ./ */
const base = process.env.VITE_BASE_PATH || './';

export default defineConfig({
  base,
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
    /** Desactiva <link rel="modulepreload"> en el bundle; en GitHub Pages + PWA a veces se mezclaba la precarga con CSS y el navegador devolvía MIME text/css al cargar un chunk como módulo. */
    modulePreload: false,
  },
  test: {
    environment: 'jsdom',
    include: ['assets/js/**/*.test.js'],
  },
});

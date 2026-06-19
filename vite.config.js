import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Si despliegas en un subdirectorio (p. ej. GitHub Pages de proyecto),
  // cambia base a '/nombre-repo/'.
  base: './',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Calculadora de Paella Valenciana',
        short_name: 'Paella',
        description:
          'Calcula ingredientes, proporción arroz/caldo y grosor de capa de tu paella valenciana.',
        lang: 'es',
        dir: 'ltr',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fff7e6',
        theme_color: '#e8961e',
        categories: ['food', 'lifestyle', 'utilities'],
        icons: [
          { src: 'app-icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'app-icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'app-icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});

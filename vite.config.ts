import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  // Served from https://pcdeshmukh.github.io/der-die-das/
  base: '/der-die-das/',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Der Die Das – German learning games',
        short_name: 'Der Die Das',
        description: 'Learn German with quick games, level by level (A1–C2).',
        lang: 'de',
        theme_color: '#1e293b',
        background_color: '#f6f7fb',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Level content (a1-*.js, a2-*.js, ...) is cached when a level is first opened, not on install.
        globIgnores: ['**/assets/[abc][12]-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/[abc][12]-[\w-]+\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'levels', expiration: { maxEntries: 12 } },
          },
        ],
      },
    }),
  ],
});

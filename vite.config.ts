import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  // Read Supabase settings from .env (NEXT_PUBLIC_* names work as well as VITE_*).
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icon.svg'],
      manifest: {
        name: 'Recipe Reader',
        short_name: 'Recipes',
        description: 'Save recipes, hear them step by step, and keep a grocery list.',
        theme_color: '#c2410c',
        background_color: '#fffaf5',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        // Keep ingredient pictures and look-ups on the phone so they work offline after the first view.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'www.themealdb.com' && url.pathname.startsWith('/images/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ingredient-photos', expiration: { maxEntries: 600, maxAgeSeconds: 60 * 60 * 24 * 180 }, cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: ({ url }) => /(^|\.)wikimedia\.org$/.test(url.hostname),
            handler: 'CacheFirst',
            options: { cacheName: 'wiki-photos', expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 180 }, cacheableResponse: { statuses: [0, 200] } }
          },
          {
            urlPattern: ({ url }) => url.hostname === 'api.dictionaryapi.dev' || url.hostname === 'en.wikipedia.org',
            handler: 'NetworkFirst',
            options: { cacheName: 'lookups', networkTimeoutSeconds: 4, expiration: { maxEntries: 300 }, cacheableResponse: { statuses: [200] } }
          }
        ]
      }
    })
  ]
});

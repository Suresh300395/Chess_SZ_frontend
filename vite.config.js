import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const BASE_PATH = '/chess-men/'
const BASE_NO_SLASH = '/chess-men'

/**
 * Handles automatic redirects when accessing the dev/preview server without trailing slash
 * or accessing the root URL (e.g. localhost:3331/chess-men -> localhost:3331/chess-men/)
 */
const baseRedirectPlugin = () => ({
  name: 'base-redirect',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url || '/'
      const [pathname, search] = rawUrl.split('?')
      const query = search ? `?${search}` : ''

      // Allow Vite internal requests through
      if (pathname.startsWith('/@') || pathname.startsWith('/__')) {
        return next()
      }

      // Handle /chess-men without trailing slash -> redirect to /chess-men/
      if (pathname === BASE_NO_SLASH) {
        res.writeHead(301, { Location: `${BASE_PATH}${query}` })
        return res.end()
      }

      // Handle root path / -> redirect to /chess-men/
      if (pathname === '/' || pathname === '') {
        res.writeHead(302, { Location: `${BASE_PATH}${query}` })
        return res.end()
      }

      // Handle any non-prefixed paths (e.g. /registration -> /chess-men/registration)
      if (!pathname.startsWith(BASE_PATH)) {
        res.writeHead(302, { Location: `${BASE_NO_SLASH}${pathname}${query}` })
        return res.end()
      }

      next()
    })
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      const rawUrl = req.url || '/'
      const [pathname, search] = rawUrl.split('?')
      const query = search ? `?${search}` : ''

      if (pathname.startsWith('/@') || pathname.startsWith('/__')) {
        return next()
      }

      if (pathname === BASE_NO_SLASH) {
        res.writeHead(301, { Location: `${BASE_PATH}${query}` })
        return res.end()
      }

      if (pathname === '/' || pathname === '') {
        res.writeHead(302, { Location: `${BASE_PATH}${query}` })
        return res.end()
      }

      if (!pathname.startsWith(BASE_PATH)) {
        res.writeHead(302, { Location: `${BASE_NO_SLASH}${pathname}${query}` })
        return res.end()
      }

      next()
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    baseRedirectPlugin(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: [
        'favicon.ico',
        'Circle_Logo_White.png',
        'ADITYA LOGO2.png',
        'Association_of_Indian_Universities_Logo.svg',
        'apple-touch-icon.png',
        'icon192x192.png',
        'icon512x512.png',
        'offline.html'
      ],
      manifest: {
        name: 'Aditya University - South Zone Chess Tournament',
        short_name: 'AUS Chess',
        description: 'South Zone Inter-University Chess (Men) Tournament organized by Aditya University',
        theme_color: '#d06c38',
        background_color: '#FAF6F3',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/chess-men/',
        start_url: '/chess-men/',
        id: '/chess-men/',
        categories: ['sports', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: '/chess-men/icon192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/chess-men/icon192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/chess-men/icon512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/chess-men/icon512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/chess-men/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'Registration',
            short_name: 'Register',
            description: 'Register university team for chess tournament',
            url: '/chess-men/registration',
            icons: [{ src: '/chess-men/icon192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Tournament Home',
            short_name: 'Home',
            description: 'View schedule, live boards, and tournament information',
            url: '/chess-men/',
            icons: [{ src: '/chess-men/icon192x192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        navigateFallback: '/chess-men/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Google Fonts Stylesheets
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Google Fonts Webfonts
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Tournament Static Images
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Explicitly: NEVER cache private API or Auth endpoints! Always NetworkOnly
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly',
            options: {
              backgroundSync: {
                name: 'api-sync',
                options: {
                  maxRetentionTime: 24 * 60 // Retry for max 24 Hours
                }
              }
            }
          }
        ]
      }
    })
  ],
  base: '/chess-men/',
  preview: {
    allowedHosts: [
      'tournament.adityauniversity.in',
      'https://tournament.adityauniversity.in',
      'www.tournament.adityauniversity.in'
    ]
  }
})

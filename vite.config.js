import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

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
  plugins: [react(), baseRedirectPlugin()],
  base: BASE_PATH,
  preview: {
    allowedHosts: [
      'tournament.adityauniversity.in/chess-men',
      'https://tournament.adityauniversity.in/chess-men',
      'www.tournament.adityauniversity.in/chess-men'
    ]
  }
})

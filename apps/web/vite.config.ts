/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Mock API for development (decision #37).
 * Runs the MSW handlers in src/mocks INSIDE the Vite dev server (no service worker),
 * so it works in every browser, including a real phone on the same Wi-Fi.
 * Requests that are not mocked go to the /api proxy (real backend, apps/api).
 *
 * VITE_API_MOCKS in apps/web/.env.local:
 *   (not set) or "all"   → mock every area
 *   "off"                → no mocks, everything from the real backend
 *   "friends,home"       → mock only these areas; the rest from the real backend
 * Areas: see MOCK_AREAS. Never part of a production build (apply: 'serve').
 */
const MOCK_AREAS = ['auth', 'me', 'profiles', 'friends', 'gangs', 'meetups', 'home', 'notifications', 'rooms'] as const
type MockArea = (typeof MOCK_AREAS)[number]

/** Which area an /api path belongs to (order matters: specific paths first). */
function areaOf(path: string): MockArea | null {
  if (path.startsWith('/api/auth/')) return 'auth'
  if (path === '/api/me' || path.startsWith('/api/me/') || path.startsWith('/api/users/me/')) return 'me'
  if (
    path.startsWith('/api/users/search') ||
    path.startsWith('/api/friends') ||
    path.startsWith('/api/friend-links/') ||
    path.startsWith('/api/blocks')
  ) {
    return 'friends'
  }
  if (path.startsWith('/api/users/')) return 'profiles'
  if (path === '/api/gangs' || path.startsWith('/api/gangs/')) return 'gangs'
  if (path === '/api/meetups' || path.startsWith('/api/meetups/')) return 'meetups'
  if (path === '/api/home') return 'home'
  if (path === '/api/notifications' || path.startsWith('/api/notifications/')) return 'notifications'
  if (path === '/api/rooms' || path.startsWith('/api/rooms/')) return 'rooms'
  return null
}

function mockedAreas(setting: string | undefined): Set<MockArea> {
  const value = (setting ?? 'all').trim()
  if (value === 'off') return new Set()
  if (value === 'all' || value === 'on' || value === '') return new Set(MOCK_AREAS)
  return new Set(
    value.split(',').map((raw) => {
      const area = raw.trim() as MockArea
      if (!MOCK_AREAS.includes(area)) throw new Error(`VITE_API_MOCKS: unknown area "${raw}". Use: ${MOCK_AREAS.join(', ')}`)
      return area
    }),
  )
}

function mockApi(): Plugin {
  return {
    name: 'thongyod-mock-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), 'VITE_')
      const areas = mockedAreas(env.VITE_API_MOCKS)
      if (areas.size === 0) return
      server.config.logger.info(`[mock api] mocking: ${env.VITE_API_MOCKS ?? 'all'}`)
      server.middlewares.use('/api', async (req, res, next) => {
        const area = areaOf((req.originalUrl ?? '').split('?')[0])
        if (!area || !areas.has(area)) return next() // → proxy to the real backend
        try {
          const { getResponse } = await import('msw')
          const { handlers } = await server.ssrLoadModule('/src/mocks/handlers.ts')
          const origin = `http://${req.headers.host ?? 'localhost'}`
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined
          const request = new Request(new URL(req.originalUrl ?? req.url ?? '/', origin), {
            method: req.method,
            headers: req.headers as Record<string, string>,
            body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
          })
          const response = await getResponse(handlers, request, { baseUrl: origin })
          if (!response) return next()
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), mockApi()],
  server: {
    // Bridge/editor writes on Windows may not fire file events; polling keeps hot reload reliable.
    watch: { usePolling: true, interval: 300 },
    // Real backend (NestJS, apps/api) when mocks are off or a path has no mock.
    proxy: { '/api': { target: 'http://127.0.0.1:3000', rewrite: (path) => path.replace(/^\/api/, '') } },
  },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})

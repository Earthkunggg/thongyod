/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Mock API for development (decision #37).
 * Runs the MSW handlers in src/mocks INSIDE the Vite dev server (no service worker),
 * so it works in every browser, including a real phone on the same Wi-Fi.
 * Requests with no mock handler fall through to the /api proxy (real backend).
 * Turn off with VITE_API_MOCKS=off in .env.local. Never part of a production build (apply: 'serve').
 */
function mockApi(): Plugin {
  return {
    name: 'thongyod-mock-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), 'VITE_')
      if (env.VITE_API_MOCKS === 'off') return
      server.middlewares.use('/api', async (req, res, next) => {
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

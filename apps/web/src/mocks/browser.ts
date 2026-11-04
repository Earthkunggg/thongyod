import { setupWorker } from 'msw/browser'
import { http, HttpResponse } from 'msw/http'
import { handlers } from './handlers'

const worker = setupWorker(
  ...handlers,
  // A missing demo handler must never fall through to a real API.
  http.all(/\/api(?:\/|$)/, () => HttpResponse.json(
    { error: { code: 'DEMO_API_NOT_IMPLEMENTED' } },
    { status: 501 },
  )),
)

export async function startDemoMocks(): Promise<void> {
  await worker.start({
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
      options: { scope: import.meta.env.BASE_URL },
    },
    quiet: true,
  })
}

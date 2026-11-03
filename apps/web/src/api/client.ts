// Small fetch wrapper for our API. All requests go to /api/* :
// - development with mocks: answered by MSW (src/mocks)
// - development without mocks: Vite proxies to the NestJS backend (vite.config.ts)

export class ApiError extends Error {
  readonly status: number
  readonly code: string | undefined

  constructor(status: number, code: string | undefined) {
    super(`API error ${status}${code ? ` (${code})` : ''}`)
    this.status = status
    this.code = code
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
    credentials: 'include',
  })
  if (!response.ok) {
    let code: string | undefined
    try {
      const body = (await response.json()) as { error?: { code?: string } }
      code = body.error?.code
    } catch {
      // Body is not JSON; keep code undefined.
    }
    throw new ApiError(response.status, code)
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

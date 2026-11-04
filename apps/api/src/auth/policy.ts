import { ForbiddenException } from '@nestjs/common'
import type { IncomingMessage } from 'node:http'

export const ALLOW_DEV_SESSIONS = Symbol('ALLOW_DEV_SESSIONS')
const LOCAL_ORIGINS = new Set(['http://localhost:5173', 'http://127.0.0.1:5173'])

export function devLoginEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.ENABLE_DEV_LOGIN !== undefined && !['true', 'false'].includes(env.ENABLE_DEV_LOGIN)) {
    throw new Error('ENABLE_DEV_LOGIN must be true or false')
  }
  const enabled = env.ENABLE_DEV_LOGIN === 'true'
  if (enabled && (env.NODE_ENV !== 'development' || env.APP_ENV !== 'local')) {
    throw new Error('Dev login requires NODE_ENV=development and APP_ENV=local')
  }
  return enabled
}

export function assertProductionConfiguration(): void {
  if (devLoginEnabled()) throw new Error('Dev login is excluded from the production entry point')
  if (process.env.NODE_ENV !== 'production' || process.env.APP_ENV === 'local') {
    throw new Error('Production entry point requires production mode and a non-local app environment')
  }
}

function deny(code: 'DEV_ACCESS_DENIED' | 'ORIGIN_NOT_ALLOWED'): never {
  throw new ForbiddenException({ error: { code } })
}

export function assertDevRequest(request: IncomingMessage): void {
  if (!devLoginEnabled() || !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '')) {
    deny('DEV_ACCESS_DENIED')
  }
  const origin = request.headers.origin
  if (origin !== undefined) {
    if (!LOCAL_ORIGINS.has(origin)) deny('ORIGIN_NOT_ALLOWED')
  } else {
    // Same-origin browser GET may omit Origin. Accept its localhost Referer only.
    if (request.method !== 'GET' || !request.headers.referer) deny('ORIGIN_NOT_ALLOWED')
    try {
      if (!LOCAL_ORIGINS.has(new URL(request.headers.referer).origin)) deny('ORIGIN_NOT_ALLOWED')
    } catch { deny('ORIGIN_NOT_ALLOWED') }
  }
}

export function assertMutationOrigin(request: IncomingMessage): void {
  const origin = request.headers.origin
  if (process.env.NODE_ENV === 'development' && process.env.APP_ENV === 'local') {
    if (!origin || !LOCAL_ORIGINS.has(origin)) deny('ORIGIN_NOT_ALLOWED')
    return
  }
  const configured = process.env.APP_ORIGIN
  if (!configured || !origin || origin !== configured) deny('ORIGIN_NOT_ALLOWED')
  try {
    const url = new URL(configured)
    if (url.protocol !== 'https:' || url.origin !== configured) deny('ORIGIN_NOT_ALLOWED')
  } catch { deny('ORIGIN_NOT_ALLOWED') }
}

export function secureCookie(): boolean {
  return !(process.env.NODE_ENV === 'development' && process.env.APP_ENV === 'local')
}

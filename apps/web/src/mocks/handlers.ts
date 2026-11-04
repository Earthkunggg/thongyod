// Mock API handlers (MSW syntax). Run by the Vite dev server (vite.config.ts → mockApi), not a service worker.
// Paths and shapes follow the contract in docs/HANDOFF.md.
import { delay } from 'msw'
import { http, HttpResponse } from 'msw/http'
import type { MeetupResponse } from '@thongyod/shared'
import { createMeetup, getHome, getMeetup, listMeetups, listMyGangs, ME, setHidden, setResponse, type MutationResult, type Visibility } from './db'
import * as friends from './friends'
import * as notifications from './notifications'
import * as profiles from './profiles'

const RESPONSES: MeetupResponse[] = ['going', 'maybe', 'not_going']
const LATENCY_MS = 300 // small delay so loading states are visible during development
const MAX_RANGE_MS = 93 * 24 * 3_600_000 // decision #40

function reply(result: MutationResult) {
  return result.ok
    ? HttpResponse.json(result.meetup)
    : HttpResponse.json({ error: { code: result.code } }, { status: result.status })
}

const errorBody = (status: number, code: string) => HttpResponse.json({ error: { code } }, { status })

function replyFriend(result: friends.FriendResult, okStatus = 200) {
  if (!result.ok) return errorBody(result.status, result.code)
  return result.data === null ? new HttpResponse(null, { status: 204 }) : HttpResponse.json(result.data, { status: okStatus })
}

function replyMe(result: profiles.ProfileResult) {
  if (result.ok) return HttpResponse.json(result.me)
  return HttpResponse.json({ error: { code: result.code, retryAt: result.retryAt } }, { status: result.status })
}

/** Paged list limit: default 20, max 50 (decision #43). null = invalid. */
function listLimit(url: URL): number | null {
  const limit = Number(url.searchParams.get('limit') ?? 20)
  return Number.isInteger(limit) && limit >= 1 && limit <= 50 ? limit : null
}

const invalid = (field: string) => HttpResponse.json({ error: { code: 'INVALID_REQUEST', field } }, { status: 400 })

export const handlers = [
  http.get('/api/home', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json(getHome())
  }),

  http.get('/api/meetups', async ({ request }) => {
    await delay(LATENCY_MS)
    const url = new URL(request.url)
    const from = new Date(url.searchParams.get('from') ?? '')
    const to = new Date(url.searchParams.get('to') ?? '')
    const visibility = (url.searchParams.get('visibility') ?? 'visible') as Visibility
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const offset = Number(url.searchParams.get('cursor') ?? 0)
    if (Number.isNaN(from.getTime())) return invalid('from')
    if (Number.isNaN(to.getTime()) || to <= from || to.getTime() - from.getTime() > MAX_RANGE_MS) return invalid('to')
    if (!['visible', 'hidden', 'all'].includes(visibility)) return invalid('visibility')
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return invalid('limit')
    if (!Number.isInteger(offset) || offset < 0) return invalid('cursor')
    const all = listMeetups(from, to, visibility)
    const items = all.slice(offset, offset + limit)
    // Mock cursor = offset as text. The real API uses an opaque cursor: never parse it.
    return HttpResponse.json({ items, nextCursor: offset + limit < all.length ? String(offset + limit) : null })
  }),

  http.post('/api/meetups', async ({ request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.gangId !== 'string') return invalid('gangId')
    if (typeof body.title !== 'string') return invalid('title')
    if (typeof body.startsAt !== 'string') return invalid('startsAt')
    const result = createMeetup({ gangId: body.gangId, title: body.title, startsAt: body.startsAt })
    if (result.ok) return HttpResponse.json(result.meetup, { status: 201 })
    const field = 'field' in result ? result.field : undefined
    return HttpResponse.json({ error: { code: result.code, field } }, { status: result.status })
  }),

  http.get('/api/meetups/:id', async ({ params }) => {
    await delay(LATENCY_MS)
    const meetup = getMeetup(String(params.id))
    return meetup ? HttpResponse.json(meetup) : HttpResponse.json({ error: { code: 'MEETUP_NOT_FOUND' } }, { status: 404 })
  }),

  http.put('/api/meetups/:id/response', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { response?: unknown; scheduleVersion?: unknown } | null
    if (!body || !RESPONSES.includes(body.response as MeetupResponse)) return invalid('response')
    if (typeof body.scheduleVersion !== 'number') return invalid('scheduleVersion')
    return reply(setResponse(String(params.id), body.response as MeetupResponse, body.scheduleVersion))
  }),

  http.delete('/api/meetups/:id/response', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const version = Number(new URL(request.url).searchParams.get('scheduleVersion'))
    if (!Number.isInteger(version)) return invalid('scheduleVersion')
    return reply(setResponse(String(params.id), null, version))
  }),

  http.put('/api/meetups/:id/visibility', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { hidden?: unknown } | null
    if (!body || typeof body.hidden !== 'boolean') return invalid('hidden')
    return reply(setHidden(String(params.id), body.hidden))
  }),

  // ---------- Gangs ----------
  http.get('/api/gangs', async ({ request }) => {
    await delay(LATENCY_MS)
    const url = new URL(request.url)
    const limit = listLimit(url)
    if (limit === null) return invalid('limit')
    return HttpResponse.json(friends.page(listMyGangs(url.searchParams.get('q') ?? ''), url.searchParams.get('cursor'), limit))
  }),

  http.get('/api/gangs/:id', async ({ params }) => {
    await delay(LATENCY_MS)
    const gang = profiles.getGangDetail(String(params.id))
    return gang ? HttpResponse.json(gang) : errorBody(404, 'GANG_NOT_FOUND')
  }),

  // ---------- Notifications (provisional) ----------
  http.get('/api/notifications', async ({ request }) => {
    await delay(LATENCY_MS)
    const url = new URL(request.url)
    const limit = listLimit(url)
    if (limit === null) return invalid('limit')
    return HttpResponse.json(notifications.listNotifications(url.searchParams.get('cursor'), limit))
  }),

  http.post('/api/notifications/read', async ({ request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null
    if (!body || (body.ids !== undefined && !(Array.isArray(body.ids) && body.ids.every((id) => typeof id === 'string')))) return invalid('ids')
    notifications.markRead(body.ids as string[] | undefined)
    return new HttpResponse(null, { status: 204 })
  }),

  // ---------- Friends ----------
  http.get('/api/friends', async ({ request }) => {
    await delay(LATENCY_MS)
    const url = new URL(request.url)
    const limit = listLimit(url)
    if (limit === null) return invalid('limit')
    return HttpResponse.json(friends.listFriends(url.searchParams.get('q') ?? '', url.searchParams.get('cursor'), limit))
  }),

  http.get('/api/friends/requests', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json(friends.getRequests())
  }),

  http.get('/api/users/search', async ({ request }) => {
    await delay(LATENCY_MS)
    const handle = new URL(request.url).searchParams.get('handle') ?? ''
    if (handle.trim() === '') return invalid('handle')
    const found = friends.searchByHandle(handle)
    return found ? HttpResponse.json(found) : errorBody(404, 'USER_NOT_FOUND')
  }),

  http.get('/api/users/:id/mutual-friends', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const url = new URL(request.url)
    const limit = listLimit(url)
    if (limit === null) return invalid('limit')
    const result = friends.listMutual(String(params.id), url.searchParams.get('cursor'), limit)
    return result ? HttpResponse.json(result) : errorBody(404, 'USER_NOT_FOUND')
  }),

  http.get('/api/friends/link', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json({ code: friends.myLinkCode() })
  }),

  http.post('/api/friends/link', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json({ code: friends.regenerateLink() })
  }),

  http.get('/api/friend-links/:code', async ({ params }) => {
    await delay(LATENCY_MS)
    const found = friends.cardByLink(String(params.code))
    return found ? HttpResponse.json(found) : errorBody(404, 'LINK_INVALID')
  }),

  http.post('/api/friends/requests', async ({ request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { userId?: unknown } | null
    if (!body || typeof body.userId !== 'string') return invalid('userId')
    return replyFriend(friends.sendRequest(body.userId), 201)
  }),

  http.post('/api/friends/requests/:id/accept', async ({ params }) => {
    await delay(LATENCY_MS)
    return replyFriend(friends.acceptRequest(String(params.id)))
  }),

  http.delete('/api/friends/requests/:id', async ({ params }) => {
    await delay(LATENCY_MS)
    return replyFriend(friends.deleteRequest(String(params.id)))
  }),

  http.delete('/api/friends/:userId', async ({ params }) => {
    await delay(LATENCY_MS)
    return replyFriend(friends.unfriend(String(params.userId)))
  }),

  http.post('/api/blocks', async ({ request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { userId?: unknown } | null
    if (!body || typeof body.userId !== 'string') return invalid('userId')
    return replyFriend(friends.block(body.userId))
  }),

  // ---------- Profile ----------
  http.get('/api/me', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json(profiles.getMe())
  }),

  http.patch('/api/me', async ({ request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return invalid('body')
    if (body.displayName !== undefined && typeof body.displayName !== 'string') return invalid('displayName')
    if (body.handle !== undefined && typeof body.handle !== 'string') return invalid('handle')
    if (body.bio !== undefined && body.bio !== null && typeof body.bio !== 'string') return invalid('bio')
    return replyMe(profiles.updateMe(body as { displayName?: string; bio?: string | null; handle?: string }))
  }),

  ...(['avatar', 'cover'] as const).flatMap((kind) => [
    http.post(`/api/me/${kind}`, async ({ request }) => {
      await delay(LATENCY_MS)
      const form = await request.formData().catch(() => null)
      const file = form?.get('file')
      if (!(file instanceof File)) return invalid('file')
      return replyMe(await profiles.setPhoto(kind, file))
    }),
    http.delete(`/api/me/${kind}`, async () => {
      await delay(LATENCY_MS)
      return replyMe(await profiles.setPhoto(kind, null))
    }),
  ]),

  http.get('/api/users/:id/profile', async ({ params }) => {
    await delay(LATENCY_MS)
    const id = String(params.id)
    const profile = profiles.getProfile(id === 'me' ? ME : id)
    return profile ? HttpResponse.json(profile) : errorBody(404, 'USER_NOT_FOUND')
  }),
]

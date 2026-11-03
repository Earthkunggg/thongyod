// Mock API handlers (MSW syntax). Run by the Vite dev server (vite.config.ts → mockApi), not a service worker.
// Paths and shapes follow the contract in docs/HANDOFF.md.
import { delay } from 'msw'
import { http, HttpResponse } from 'msw/http'
import type { MeetupResponse } from '@thongyod/shared'
import { getHome, getMeetup, listMeetups, ME, setHidden, setResponse, type MutationResult, type Visibility } from './db'
import * as friends from './friends'
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

  // ---------- Friends ----------
  http.get('/api/friends', async () => {
    await delay(LATENCY_MS)
    return HttpResponse.json(friends.getOverview())
  }),

  http.get('/api/users/search', async ({ request }) => {
    await delay(LATENCY_MS)
    const name = new URL(request.url).searchParams.get('name') ?? ''
    if (name.trim() === '') return invalid('name')
    const found = friends.searchByName(name)
    return found ? HttpResponse.json(found) : errorBody(404, 'USER_NOT_FOUND')
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
    if (body.bio !== undefined && body.bio !== null && typeof body.bio !== 'string') return invalid('bio')
    const result = profiles.updateMe(body as { displayName?: string; bio?: string | null })
    return result.ok ? HttpResponse.json(result.me) : errorBody(result.status, result.code)
  }),

  http.get('/api/users/:id/profile', async ({ params }) => {
    await delay(LATENCY_MS)
    const id = String(params.id)
    const profile = profiles.getProfile(id === 'me' ? ME : id)
    return profile ? HttpResponse.json(profile) : errorBody(404, 'USER_NOT_FOUND')
  }),
]

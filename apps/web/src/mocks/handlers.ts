// Mock API handlers (MSW syntax). Run by the Vite dev server (vite.config.ts → mockApi), not a service worker.
// Paths and shapes follow the contract in docs/HANDOFF.md.
import { delay } from 'msw'
import { http, HttpResponse } from 'msw/http'
import type { MeetupResponse } from '@thongyod/shared'
import { getHome, getMeetup, listMeetups, setHidden, setResponse, type MutationResult } from './db'

const RESPONSES: MeetupResponse[] = ['going', 'maybe', 'not_going']
const LATENCY_MS = 300 // small delay so loading states are visible during development

function reply(result: MutationResult) {
  return result.ok
    ? HttpResponse.json(result.meetup)
    : HttpResponse.json({ error: { code: result.code } }, { status: result.status })
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
    if (Number.isNaN(from.getTime())) return invalid('from')
    if (Number.isNaN(to.getTime())) return invalid('to')
    return HttpResponse.json(listMeetups(from, to, url.searchParams.get('includeHidden') === 'true'))
  }),

  http.get('/api/meetups/:id', async ({ params }) => {
    await delay(LATENCY_MS)
    const meetup = getMeetup(String(params.id))
    return meetup ? HttpResponse.json(meetup) : HttpResponse.json({ error: { code: 'MEETUP_NOT_FOUND' } }, { status: 404 })
  }),

  http.put('/api/meetups/:id/response', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { response?: unknown } | null
    if (!body || !RESPONSES.includes(body.response as MeetupResponse)) return invalid('response')
    return reply(setResponse(String(params.id), body.response as MeetupResponse))
  }),

  http.delete('/api/meetups/:id/response', async ({ params }) => {
    await delay(LATENCY_MS)
    return reply(setResponse(String(params.id), null))
  }),

  http.put('/api/meetups/:id/hidden', async ({ params, request }) => {
    await delay(LATENCY_MS)
    const body = (await request.json().catch(() => null)) as { hidden?: unknown } | null
    if (!body || typeof body.hidden !== 'boolean') return invalid('hidden')
    return reply(setHidden(String(params.id), body.hidden))
  }),
]

// In-memory friends data for the dev mock API (decisions #34, #43, #44, #45). Resets when the dev server restarts.
// Rules: strangers are found by exact handle only; blocked people cannot find each other;
// requests need acceptance; daily request limit; regenerating the link kills the old one.
import type { CursorPage, Friend, FriendRequest, FriendRequests, PersonCard, UserCard } from '@/api/types'
import { ME, personCard, userById, users } from './db'

/** Max friend requests one person can send per 24 h (decision #40). */
export const DAILY_REQUEST_LIMIT = 20

type Request = { id: string; from: string; to: string; createdAt: Date }

const pairKey = (a: string, b: string) => [a, b].sort().join('|')
/** pair → friends since */
const friendships = new Map<string, Date>()
const befriend = (a: string, b: string, daysAgo: number) => friendships.set(pairKey(a, b), new Date(Date.now() - daysAgo * 86_400_000))
;[
  ['u1', 'u2', 400], ['u1', 'u3', 380], ['u1', 'u4', 200],
  ['u2', 'u3', 500], ['u2', 'u5', 90], ['u3', 'u5', 60], ['u2', 'u7', 30], ['u3', 'u8', 20], ['u4', 'u6', 10],
  ['u10', 'u2', 40], ['u11', 'u3', 15],
].forEach(([a, b, d]) => befriend(String(a), String(b), Number(d)))
// u20..u44 are all friends of u1 (paging test); some are friends with u2 too (mutual friends).
users.filter((x) => Number(x.id.slice(1)) >= 20).forEach((x, i) => {
  befriend('u1', x.id, 5 + i * 7)
  if (i % 3 === 0) befriend('u2', x.id, 3)
})

/** [blocker, blocked]: u9 blocked me, so I cannot find u9. */
const blocks: [string, string][] = [['u9', 'u1']]
const requests: Request[] = [
  { id: 'r1', from: 'u7', to: 'u1', createdAt: new Date(Date.now() - 3 * 3_600_000) },
  { id: 'r2', from: 'u1', to: 'u8', createdAt: new Date(Date.now() - 26 * 3_600_000) },
]
/** Friend link code → owner. One active code per user. */
const linkCodes = new Map<string, string>([
  ['earth-k7qm2x', 'u1'],
  ['ploy-55a9', 'u5'],
  ['guy-3n8d', 'u6'],
])
let nextId = 100

export const areFriends = (a: string, b: string) => friendships.has(pairKey(a, b))
export const friendsSince = (a: string, b: string) => friendships.get(pairKey(a, b)) ?? null
export const isBlocked = (a: string, b: string) => blocks.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
const friendIdsOf = (id: string) => users.filter((x) => x.id !== id && areFriends(id, x.id)).map((x) => x.id)
export const mutualIds = (a: string, b: string) => friendIdsOf(a).filter((id) => id !== b && areFriends(b, id))
const findRequest = (from: string, to: string) => requests.find((r) => r.from === from && r.to === to)
export const friendCount = (userId: string) => friendIdsOf(userId).length

function card(userId: string): UserCard {
  const user = userById(userId)!
  const sent = findRequest(ME, userId)
  const received = findRequest(userId, ME)
  const relationship =
    userId === ME ? 'self' : areFriends(ME, userId) ? 'friend' : sent ? 'request_sent' : received ? 'request_received' : 'none'
  return {
    ...personCard(userId),
    title: user.title,
    mutualFriends: userId === ME ? 0 : mutualIds(ME, userId).length,
    relationship,
    requestId: sent?.id ?? received?.id ?? null,
  }
}

const toRequest = (r: Request, other: string): FriendRequest => ({
  id: r.id,
  user: personCard(other),
  mutualFriends: mutualIds(ME, other).length,
  createdAt: r.createdAt.toISOString(),
})

/** Offset cursor for the mock only. The real API uses opaque cursors: never parse them. */
export function page<T>(all: T[], cursor: string | null, limit: number): CursorPage<T> {
  const offset = Number(cursor ?? 0) || 0
  const items = all.slice(offset, offset + limit)
  return { items, nextCursor: offset + limit < all.length ? String(offset + limit) : null }
}

const matches = (q: string, name: string, handle: string) => {
  const needle = q.trim().toLowerCase().replace(/^@/, '')
  return needle === '' || name.toLowerCase().includes(needle) || handle.includes(needle)
}

const byName = (a: PersonCard, b: PersonCard) => a.displayName.localeCompare(b.displayName, 'th') || a.userId.localeCompare(b.userId)

export function listFriends(q: string, cursor: string | null, limit: number): CursorPage<Friend> {
  const all = friendIdsOf(ME)
    .map((id) => ({ ...personCard(id), title: userById(id)!.title }))
    .filter((f) => matches(q, f.displayName, f.handle))
    .sort(byName)
  return page(all, cursor, limit)
}

export function listMutual(userId: string, cursor: string | null, limit: number): CursorPage<PersonCard> | null {
  if (!userById(userId) || isBlocked(ME, userId)) return null
  return page(mutualIds(ME, userId).map(personCard).sort(byName), cursor, limit)
}

export function getRequests(): FriendRequests {
  return {
    incoming: requests.filter((r) => r.to === ME).map((r) => toRequest(r, r.from)),
    outgoing: requests.filter((r) => r.from === ME).map((r) => toRequest(r, r.to)),
  }
}

/** Exact handle match (case-insensitive, optional leading @). No name search for strangers (#45). */
export function searchByHandle(handle: string): UserCard | null {
  const wanted = handle.trim().toLowerCase().replace(/^@/, '')
  const user = users.find((x) => x.handle === wanted)
  if (!user || isBlocked(ME, user.id)) return null
  return card(user.id)
}

/** Card of any visible user (null if unknown or blocked either way). */
export function cardOf(userId: string): UserCard | null {
  if (!userById(userId) || isBlocked(ME, userId)) return null
  return card(userId)
}

export function cardByLink(code: string): UserCard | null {
  const owner = linkCodes.get(code)
  if (!owner || isBlocked(ME, owner)) return null
  return card(owner)
}

export function myLinkCode(): string {
  for (const [code, owner] of linkCodes) if (owner === ME) return code
  return regenerateLink()
}

export function regenerateLink(): string {
  for (const [code, owner] of linkCodes) if (owner === ME) linkCodes.delete(code)
  const code = `earth-${Math.random().toString(36).slice(2, 8)}`
  linkCodes.set(code, ME)
  return code
}

export type FriendResult<T = unknown> = { ok: true; data: T } | { ok: false; status: number; code: string }
const fail = (status: number, code: string): FriendResult<never> => ({ ok: false, status, code })

export function sendRequest(userId: string): FriendResult<FriendRequest> {
  if (!userById(userId) || isBlocked(ME, userId)) return fail(404, 'USER_NOT_FOUND')
  if (userId === ME) return fail(400, 'CANNOT_ADD_SELF')
  if (areFriends(ME, userId)) return fail(409, 'ALREADY_FRIENDS')
  if (findRequest(ME, userId) || findRequest(userId, ME)) return fail(409, 'REQUEST_EXISTS')
  const dayAgo = Date.now() - 24 * 3_600_000
  if (requests.filter((r) => r.from === ME && r.createdAt.getTime() > dayAgo).length >= DAILY_REQUEST_LIMIT) {
    return fail(429, 'DAILY_LIMIT_REACHED')
  }
  const request: Request = { id: `r${nextId++}`, from: ME, to: userId, createdAt: new Date() }
  requests.push(request)
  return { ok: true, data: toRequest(request, userId) }
}

export function acceptRequest(id: string): FriendResult<null> {
  const index = requests.findIndex((r) => r.id === id && r.to === ME)
  if (index < 0) return fail(404, 'REQUEST_NOT_FOUND')
  const [request] = requests.splice(index, 1)
  befriend(request.from, request.to, 0)
  return { ok: true, data: null }
}

/** Decline a request I received (silent) or cancel one I sent. */
export function deleteRequest(id: string): FriendResult<null> {
  const index = requests.findIndex((r) => r.id === id && (r.to === ME || r.from === ME))
  if (index < 0) return fail(404, 'REQUEST_NOT_FOUND')
  requests.splice(index, 1)
  return { ok: true, data: null }
}

/** Silent unfriend (#34): no notification; gang memberships stay. */
export function unfriend(userId: string): FriendResult<null> {
  if (!areFriends(ME, userId)) return fail(404, 'NOT_FRIENDS')
  friendships.delete(pairKey(ME, userId))
  return { ok: true, data: null }
}

/** Block: also removes the friendship and pending requests both ways (#44). */
export function block(userId: string): FriendResult<null> {
  if (!userById(userId) || userId === ME) return fail(404, 'USER_NOT_FOUND')
  if (!blocks.some(([x, y]) => x === ME && y === userId)) blocks.push([ME, userId])
  friendships.delete(pairKey(ME, userId))
  for (let i = requests.length - 1; i >= 0; i--) {
    const r = requests[i]
    if ((r.from === ME && r.to === userId) || (r.from === userId && r.to === ME)) requests.splice(i, 1)
  }
  return { ok: true, data: null }
}

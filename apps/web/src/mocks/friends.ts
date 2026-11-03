// In-memory friends data for the dev mock API (decision #34). Resets when the dev server restarts.
// Rules copied from the decision: exact-name search only, blocked people cannot find each other,
// requests need acceptance, daily request limit, regenerating the link kills the old one.
import type { Friend, FriendRequest, FriendsOverview, UserCard } from '@/api/types'
import { ME, person, users } from './db'

/** Max friend requests one person can send per day. */
export const DAILY_REQUEST_LIMIT = 20

type Request = { id: string; from: string; to: string; createdAt: Date }

const pairKey = (a: string, b: string) => [a, b].sort().join('|')
const friendships = new Set(
  [
    ['u1', 'u2'], ['u1', 'u3'], ['u1', 'u4'],
    ['u2', 'u3'], ['u2', 'u5'], ['u3', 'u5'], ['u2', 'u7'], ['u3', 'u8'], ['u4', 'u6'],
  ].map(([a, b]) => pairKey(a, b)),
)
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

const areFriends = (a: string, b: string) => friendships.has(pairKey(a, b))
const isBlocked = (a: string, b: string) => blocks.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
const friendIdsOf = (id: string) => users.filter((u) => u.id !== id && areFriends(id, u.id)).map((u) => u.id)
const mutualCount = (a: string, b: string) => friendIdsOf(a).filter((id) => id !== b && areFriends(b, id)).length
const findRequest = (from: string, to: string) => requests.find((r) => r.from === from && r.to === to)

function card(userId: string): UserCard {
  const user = users.find((u) => u.id === userId)!
  const sent = findRequest(ME, userId)
  const received = findRequest(userId, ME)
  const relationship =
    userId === ME ? 'self' : areFriends(ME, userId) ? 'friend' : sent ? 'request_sent' : received ? 'request_received' : 'none'
  return {
    ...person(userId),
    title: user.title,
    mutualFriends: userId === ME ? 0 : mutualCount(ME, userId),
    relationship,
    requestId: sent?.id ?? received?.id ?? null,
  }
}

const toRequest = (r: Request, other: string): FriendRequest => ({
  id: r.id,
  user: person(other),
  mutualFriends: mutualCount(ME, other),
  createdAt: r.createdAt.toISOString(),
})

export function getOverview(): FriendsOverview {
  const friends: Friend[] = friendIdsOf(ME)
    .map((id) => ({ ...person(id), title: users.find((u) => u.id === id)!.title }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'th'))
  return {
    friends,
    incoming: requests.filter((r) => r.to === ME).map((r) => toRequest(r, r.from)),
    outgoing: requests.filter((r) => r.from === ME).map((r) => toRequest(r, r.to)),
  }
}

/** Exact name match (trimmed, case-insensitive). No partial matches, no browsing. */
export function searchByName(name: string): UserCard | null {
  const wanted = name.trim().toLowerCase()
  const user = users.find((u) => u.name.toLowerCase() === wanted)
  if (!user || isBlocked(ME, user.id)) return null
  return card(user.id)
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
  if (!users.some((u) => u.id === userId) || isBlocked(ME, userId)) return fail(404, 'USER_NOT_FOUND')
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
  friendships.add(pairKey(request.from, request.to))
  return { ok: true, data: null }
}

/** Decline a request I received (silent) or cancel one I sent. */
export function deleteRequest(id: string): FriendResult<null> {
  const index = requests.findIndex((r) => r.id === id && (r.to === ME || r.from === ME))
  if (index < 0) return fail(404, 'REQUEST_NOT_FOUND')
  requests.splice(index, 1)
  return { ok: true, data: null }
}

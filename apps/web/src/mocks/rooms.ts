// In-memory game rooms for the mock API (provisional contract, DECISIONS #76, docs/HANDOFF.md).
// DEMO ONLY: each browser has its own mock, so two real phones cannot meet here. To show the flow,
// a few mock friends join a new room by themselves. The real server must do this with shared state.
import type { Room, RoomGame, RoomPlayer, SpyRoomSettings } from '@/api/types'
import { dealSpy, maxSpies } from '@/features/spy/logic'
import { spyPool } from '@/features/spy/settings'
import { SPY_PAIRS, SPY_PLACES } from '@/config/games/spy'
import { secureRandomInt } from '@/lib/random'
import { ME, person } from './db'

export const MAX_PLAYERS = 12
const ROOM_TTL_MS = 3 * 3_600_000
/** Mock friends who "join" a room I create, and when (ms). */
const DEMO_JOINERS: [string, number][] = [['u2', 1500], ['u3', 3200], ['u5', 5000], ['u4', 7500]]

type Internal = {
  code: string
  game: RoomGame
  hostId: string
  playerIds: string[]
  settings: SpyRoomSettings
  state: Room['state']
  round: (Room['round'] & { spies: string[]; secret: string; spyWord: string | null }) | null
  createdAt: number
}

const rooms = new Map<string, Internal>()

export type RoomResult = { ok: true; room: Room } | { ok: false; status: number; code: string }

function newCode(): string {
  for (;;) {
    const code = String(100000 + secureRandomInt(900000))
    if (!rooms.has(code)) return code
  }
}

function view(r: Internal, me: string): Room {
  const joined = r.playerIds.includes(me)
  const players: RoomPlayer[] = r.playerIds.map((id) => ({ ...person(id), isHost: id === r.hostId }))
  let mySecret: Room['mySecret'] = null
  if (joined && r.round) {
    const isSpy = r.round.spies.includes(me)
    mySecret = { isSpy, text: r.settings.mode === 'places' ? (isSpy ? null : r.round.secret) : isSpy ? r.round.spyWord : r.round.secret }
  }
  const round = r.round
    ? {
        number: r.round.number,
        startedAt: r.round.startedAt,
        endsAt: r.round.endsAt,
        firstPlayerId: r.round.firstPlayerId,
        reveal: r.state === 'revealed' ? { spyIds: r.round.spies, secret: r.round.secret, spyWord: r.round.spyWord } : null,
      }
    : null
  return { code: r.code, game: r.game, state: r.state, hostId: r.hostId, players, maxPlayers: MAX_PLAYERS, settings: r.settings, round, mySecret, joined, expiresAt: new Date(r.createdAt + ROOM_TTL_MS).toISOString() }
}

const notFound = { ok: false as const, status: 404, code: 'ROOM_NOT_FOUND' }
const hostOnly = { ok: false as const, status: 403, code: 'HOST_ONLY' }

function cleanSettings(raw: Partial<SpyRoomSettings> | undefined): SpyRoomSettings {
  const mode = raw?.mode === 'pairs' ? 'pairs' : 'places'
  const valid = (mode === 'places' ? SPY_PLACES : SPY_PAIRS).map((p) => p.id as string)
  const packs = (raw?.packs ?? []).filter((id) => valid.includes(id))
  const minutes = raw?.minutes === 3 || raw?.minutes === 8 ? raw.minutes : 5
  return { mode, minutes, spies: Math.max(1, Math.min(3, Math.round(raw?.spies ?? 1))), packs: packs.length ? packs : valid }
}

export function createRoom(game: RoomGame, settings: Partial<SpyRoomSettings> | undefined): RoomResult {
  if (game !== 'spy') return { ok: false, status: 400, code: 'INVALID_REQUEST' }
  const code = newCode()
  const room: Internal = { code, game, hostId: ME, playerIds: [ME], settings: cleanSettings(settings), state: 'lobby', round: null, createdAt: Date.now() }
  rooms.set(code, room)
  for (const [id, ms] of DEMO_JOINERS) setTimeout(() => room.state === 'lobby' && !room.playerIds.includes(id) && room.playerIds.push(id), ms)
  return { ok: true, room: view(room, ME) }
}

export function getRoom(code: string): RoomResult {
  const r = rooms.get(code)
  return r ? { ok: true, room: view(r, ME) } : notFound
}

export function joinRoom(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (!r.playerIds.includes(ME)) {
    if (r.state !== 'lobby') return { ok: false, status: 409, code: 'ROOM_STARTED' }
    if (r.playerIds.length >= MAX_PLAYERS) return { ok: false, status: 409, code: 'ROOM_FULL' }
    r.playerIds.push(ME)
  }
  return { ok: true, room: view(r, ME) }
}

export function leaveRoom(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  r.playerIds = r.playerIds.filter((id) => id !== ME)
  if (r.hostId === ME && r.playerIds.length) r.hostId = r.playerIds[0]
  if (!r.playerIds.length) rooms.delete(code)
  return { ok: true, room: view(r, ME) }
}

export function updateSettings(code: string, settings: Partial<SpyRoomSettings>): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  r.settings = cleanSettings({ ...r.settings, ...settings, packs: settings.mode && settings.mode !== r.settings.mode ? [] : (settings.packs ?? r.settings.packs) })
  return { ok: true, room: view(r, ME) }
}

/** Host starts (or restarts) a round: the server deals roles fairly; each phone only gets its own secret. */
export function startRound(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  if (r.playerIds.length < 3) return { ok: false, status: 409, code: 'NOT_ENOUGH_PLAYERS' }
  const pool = spyPool(r.settings.mode, r.settings.packs)
  const item = pool[secureRandomInt(pool.length)]
  const deal = dealSpy({ players: r.playerIds.length, spies: Math.min(r.settings.spies, maxSpies(r.playerIds.length)), mode: r.settings.mode, item })
  const now = Date.now()
  r.round = {
    number: (r.round?.number ?? 0) + 1,
    startedAt: new Date(now).toISOString(),
    endsAt: new Date(now + r.settings.minutes * 60_000).toISOString(),
    firstPlayerId: r.playerIds[deal.first],
    reveal: null,
    spies: r.playerIds.filter((_, i) => deal.spies[i]),
    secret: deal.secret,
    spyWord: deal.spyWord,
  }
  r.state = 'playing'
  return { ok: true, room: view(r, ME) }
}

export function revealRound(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  if (!r.round) return { ok: false, status: 409, code: 'NO_ROUND' }
  r.state = 'revealed'
  return { ok: true, room: view(r, ME) }
}

export function backToLobby(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  r.state = 'lobby'
  r.round = null
  return { ok: true, room: view(r, ME) }
}

/** A room someone else hosts, so the "ชวนเล่น" notification and joining by code can be tried in the demo. */
const demo: Internal = { code: '482913', game: 'spy', hostId: 'u2', playerIds: ['u2', 'u3', 'u5'], settings: cleanSettings({ mode: 'pairs' }), state: 'lobby', round: null, createdAt: Date.now() }
rooms.set(demo.code, demo)

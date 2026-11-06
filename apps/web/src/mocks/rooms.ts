// In-memory game rooms for the mock API (provisional contract, DECISIONS #76 / #79, docs/HANDOFF.md).
// DEMO ONLY: each browser has its own mock, so two real phones cannot meet here. To show the flow,
// a few mock friends join a new room by themselves and answer party cards. The real server keeps shared state.
import type { PartyRoomSettings, Room, RoomGame, RoomPlayer, RoomState, SpyRoomSettings } from '@/api/types'
import { MOST_LIKELY, NEVER_HAVE } from '@/config/games/party'
import { SPY_PAIRS, SPY_PLACES } from '@/config/games/spy'
import { cardsOf } from '@/features/party/logic'
import { START_FINGERS, allVoted, foldFingers, tally, validVote, type PartyGame } from '@/features/party/roomLogic'
import { dealSpy, maxSpies } from '@/features/spy/logic'
import { spyPool } from '@/features/spy/settings'
import { secureRandomInt, shuffle } from '@/lib/random'
import { ME, person } from './db'

export const MAX_PLAYERS = 12
const ROOM_TTL_MS = 3 * 3_600_000
/** Mock friends who "join" a room I create, and when (ms). */
const DEMO_JOINERS: [string, number][] = [['u2', 1500], ['u3', 3200], ['u5', 5000], ['u4', 7500]]
const ROOM_GAMES: RoomGame[] = ['spy', 'mostLikely', 'neverHave']
const MIN_PLAYERS: Record<RoomGame, number> = { spy: 3, mostLikely: 3, neverHave: 2 }

type SpyState = { settings: SpyRoomSettings; round: { number: number; startedAt: string; endsAt: string; firstPlayerId: string; spies: string[]; secret: string; spyWord: string | null } | null }
type PartyState = {
  settings: PartyRoomSettings
  /** Cards not used yet in this room. */
  deck: { pack: string; text: string }[]
  round: { number: number; card: string; pack: string; votes: Map<string, string>; shown: boolean } | null
  fingers: Record<string, number> | null
}

type Internal = { code: string; game: RoomGame; hostId: string; playerIds: string[]; state: RoomState; createdAt: number; spy: SpyState; party: PartyState }

const rooms = new Map<string, Internal>()

export type RoomResult = { ok: true; room: Room } | { ok: false; status: number; code: string }

const notFound = { ok: false as const, status: 404, code: 'ROOM_NOT_FOUND' }
const hostOnly = { ok: false as const, status: 403, code: 'HOST_ONLY' }
const packsOf = (game: PartyGame) => (game === 'mostLikely' ? MOST_LIKELY : NEVER_HAVE)

function newCode(): string {
  for (;;) {
    const code = String(100000 + secureRandomInt(900000))
    if (!rooms.has(code)) return code
  }
}

function view(r: Internal, me: string): Room {
  const joined = r.playerIds.includes(me)
  const base = {
    code: r.code,
    state: r.state,
    hostId: r.hostId,
    players: r.playerIds.map((id): RoomPlayer => ({ ...person(id), isHost: id === r.hostId })),
    maxPlayers: MAX_PLAYERS,
    joined,
    expiresAt: new Date(r.createdAt + ROOM_TTL_MS).toISOString(),
  }
  if (r.game === 'spy') {
    const round = r.spy.round
    let mySecret = null
    if (joined && round) {
      const isSpy = round.spies.includes(me)
      mySecret = { isSpy, text: r.spy.settings.mode === 'places' ? (isSpy ? null : round.secret) : isSpy ? round.spyWord : round.secret }
    }
    return {
      ...base,
      game: 'spy',
      settings: r.spy.settings,
      mySecret,
      round: round
        ? { number: round.number, startedAt: round.startedAt, endsAt: round.endsAt, firstPlayerId: round.firstPlayerId, reveal: r.state === 'revealed' ? { spyIds: round.spies, secret: round.secret, spyWord: round.spyWord } : null }
        : null,
    }
  }
  const round = r.party.round
  return {
    ...base,
    game: r.game,
    settings: r.party.settings,
    fingers: r.party.fingers,
    round: round
      ? {
          number: round.number,
          card: round.card,
          pack: round.pack,
          votedIds: [...round.votes.keys()],
          myVote: round.votes.get(me) ?? null,
          result: round.shown ? tally(r.game, round.votes) : null,
        }
      : null,
  }
}

function cleanSpy(raw: Partial<SpyRoomSettings> | undefined): SpyRoomSettings {
  const mode = raw?.mode === 'pairs' ? 'pairs' : 'places'
  const valid = (mode === 'places' ? SPY_PLACES : SPY_PAIRS).map((p) => p.id as string)
  const packs = (raw?.packs ?? []).filter((id) => valid.includes(id))
  const minutes = raw?.minutes === 3 || raw?.minutes === 8 ? raw.minutes : 5
  return { mode, minutes, spies: Math.max(1, Math.min(3, Math.round(raw?.spies ?? 1))), packs: packs.length ? packs : valid }
}

function cleanParty(game: PartyGame, raw: Partial<PartyRoomSettings> | undefined): PartyRoomSettings {
  const valid = packsOf(game).map((p) => p.id as string)
  const packs = (raw?.packs ?? []).filter((id) => valid.includes(id))
  return { packs: packs.length ? packs : valid }
}

function emptyParty(): PartyState {
  return { settings: { packs: [] }, deck: [], round: null, fingers: null }
}

export function createRoom(game: string, settings: Record<string, unknown> | undefined): RoomResult {
  if (!ROOM_GAMES.includes(game as RoomGame)) return { ok: false, status: 400, code: 'INVALID_REQUEST' }
  const g = game as RoomGame
  const room: Internal = {
    code: newCode(),
    game: g,
    hostId: ME,
    playerIds: [ME],
    state: 'lobby',
    createdAt: Date.now(),
    spy: { settings: cleanSpy(settings as Partial<SpyRoomSettings>), round: null },
    party: emptyParty(),
  }
  if (g !== 'spy') room.party.settings = cleanParty(g, settings as Partial<PartyRoomSettings>)
  rooms.set(room.code, room)
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

export function updateSettings(code: string, settings: Record<string, unknown>): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  if (r.game === 'spy') {
    const s = settings as Partial<SpyRoomSettings>
    const cur = r.spy.settings
    r.spy.settings = cleanSpy({ ...cur, ...s, packs: s.mode && s.mode !== cur.mode ? [] : (s.packs ?? cur.packs) })
  } else {
    r.party.settings = cleanParty(r.game, { ...r.party.settings, ...(settings as Partial<PartyRoomSettings>) })
    r.party.deck = []
  }
  return { ok: true, room: view(r, ME) }
}

/** Mock friends answer a party card after a short think. */
function botsAnswer(r: Internal, game: PartyGame, roundNo: number) {
  for (const id of r.playerIds) {
    if (id === ME) continue
    setTimeout(
      () => {
        const round = r.party.round
        if (!round || round.number !== roundNo || round.shown || !r.playerIds.includes(id)) return
        const choice = game === 'mostLikely' ? r.playerIds[secureRandomInt(r.playerIds.length)] : secureRandomInt(5) < 2 ? 'have' : 'never'
        round.votes.set(id, choice)
        finishIfAll(r)
      },
      900 + secureRandomInt(2600),
    )
  }
}

function finishIfAll(r: Internal) {
  const round = r.party.round
  if (!round || round.shown || r.game === 'spy') return
  if (allVoted(r.playerIds, round.votes)) showResult(r)
}

function showResult(r: Internal) {
  const round = r.party.round
  if (!round || r.game === 'spy') return
  round.shown = true
  r.state = 'revealed'
  if (r.game === 'neverHave') r.party.fingers = foldFingers(r.party.fingers ?? {}, tally('neverHave', round.votes).haveIds)
}

/** Host starts (or deals the next) round. สายลับ: fair deal, each phone gets only its own secret. Party: next unused card. */
export function startRound(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  if (r.playerIds.length < MIN_PLAYERS[r.game]) return { ok: false, status: 409, code: 'NOT_ENOUGH_PLAYERS' }
  if (r.game === 'spy') {
    const s = r.spy.settings
    const pool = spyPool(s.mode, s.packs)
    const item = pool[secureRandomInt(pool.length)]
    const deal = dealSpy({ players: r.playerIds.length, spies: Math.min(s.spies, maxSpies(r.playerIds.length)), mode: s.mode, item })
    const now = Date.now()
    r.spy.round = {
      number: (r.spy.round?.number ?? 0) + 1,
      startedAt: new Date(now).toISOString(),
      endsAt: new Date(now + s.minutes * 60_000).toISOString(),
      firstPlayerId: r.playerIds[deal.first],
      spies: r.playerIds.filter((_, i) => deal.spies[i]),
      secret: deal.secret,
      spyWord: deal.spyWord,
    }
  } else {
    const p = r.party
    if (!p.deck.length) p.deck = shuffle(cardsOf(packsOf(r.game), p.settings.packs))
    const card = p.deck.shift()!
    if (r.game === 'neverHave' && !p.fingers) p.fingers = Object.fromEntries(r.playerIds.map((id) => [id, START_FINGERS]))
    p.round = { number: (p.round?.number ?? 0) + 1, card: card.text, pack: card.pack, votes: new Map(), shown: false }
    botsAnswer(r, r.game, p.round.number)
  }
  r.state = 'playing'
  return { ok: true, room: view(r, ME) }
}

/** An answer to the current party card (can be changed until the result shows). */
export function vote(code: string, choice: unknown): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.game === 'spy' || !r.party.round || r.state !== 'playing') return { ok: false, status: 409, code: 'NO_ROUND' }
  if (!r.playerIds.includes(ME)) return { ok: false, status: 403, code: 'NOT_IN_ROOM' }
  if (typeof choice !== 'string' || !validVote(r.game, choice, r.playerIds)) return { ok: false, status: 400, code: 'INVALID_REQUEST' }
  r.party.round.votes.set(ME, choice)
  finishIfAll(r)
  return { ok: true, room: view(r, ME) }
}

export function revealRound(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  if (r.game === 'spy') {
    if (!r.spy.round) return { ok: false, status: 409, code: 'NO_ROUND' }
    r.state = 'revealed'
  } else {
    if (!r.party.round) return { ok: false, status: 409, code: 'NO_ROUND' }
    showResult(r)
  }
  return { ok: true, room: view(r, ME) }
}

/** Back to the lobby: round cleared, ไม่เคย… fingers reset. */
export function backToLobby(code: string): RoomResult {
  const r = rooms.get(code)
  if (!r) return notFound
  if (r.hostId !== ME) return hostOnly
  r.state = 'lobby'
  r.spy.round = null
  r.party.round = null
  r.party.fingers = null
  return { ok: true, room: view(r, ME) }
}

/** Rooms someone else hosts, so the "ชวนเล่น" notification and joining by code can be tried in the demo. */
function seed(code: string, game: RoomGame) {
  const r: Internal = { code, game, hostId: 'u2', playerIds: ['u2', 'u3', 'u5'], state: 'lobby', createdAt: Date.now(), spy: { settings: cleanSpy({ mode: 'pairs' }), round: null }, party: emptyParty() }
  if (game !== 'spy') r.party.settings = cleanParty(game, undefined)
  rooms.set(code, r)
}
seed('482913', 'spy')
seed('305117', 'mostLikely')

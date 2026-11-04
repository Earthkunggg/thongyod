// ห้องโหวตร้าน (spec §8.6), one phone passed around. Reuses the quick-vote engine (#14) with
// multi-select ballots; only the decision rule is different. Pure logic, tested.
import { MAX_VOTERS, MIN_VOTERS, rank, type QuickVoteSession } from '@/features/quick-vote/logic'
import { secureRandomInt } from '@/lib/random'

export const ROOM_MIN_OPTIONS = 2
export const ROOM_MAX_OPTIONS = 12
export { MIN_VOTERS, MAX_VOTERS }

/** A room session: every voter ticks every place they are OK with. null = invalid setup. */
export function createRoom(options: readonly string[], voterCount: number): QuickVoteSession | null {
  const clean = [...new Set(options.map((o) => o.trim()).filter(Boolean))]
  if (clean.length < ROOM_MIN_OPTIONS || clean.length > ROOM_MAX_OPTIONS) return null
  if (!Number.isInteger(voterCount) || voterCount < MIN_VOTERS || voterCount > MAX_VOTERS) return null
  return { question: '', options: clean, voterCount, multiple: true, round: 1, candidates: clean.map((_, i) => i), ballots: [], phase: 'voting', winner: null, decidedBy: null }
}

/** Places everyone who voted accepted. */
export function acceptedByAll(session: QuickVoteSession): number[] {
  const voters = session.ballots.length
  if (voters === 0) return []
  return rank(session)
    .filter((r) => r.votes === voters)
    .map((r) => r.index)
    .sort((a, b) => a - b)
}

export type RoomOutcome =
  /** Everyone OK with these; one was picked at random (fair). */
  | { kind: 'agreed'; winner: number; pool: number[] }
  /** No common place: the most-voted ones, for the group to choose what to do. */
  | { kind: 'noCommon'; top: number[]; votes: number }

export function roomOutcome(session: QuickVoteSession, random: (max: number) => number = secureRandomInt): RoomOutcome {
  const pool = acceptedByAll(session)
  if (pool.length > 0) return { kind: 'agreed', winner: pool[random(pool.length)], pool }
  const ranked = rank(session)
  const best = ranked[0]?.votes ?? 0
  return { kind: 'noCommon', top: ranked.filter((r) => r.votes === best && best > 0).map((r) => r.index), votes: best }
}

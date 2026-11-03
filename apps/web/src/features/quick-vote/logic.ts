// Quick vote (single device, pass the phone). Pure logic: no React, no DOM.
// Everything that decides a result lives here so it can be unit-tested.

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6
export const MIN_VOTERS = 2
export const MAX_VOTERS = 30

export type Phase =
  | 'voting' // current voter is choosing
  | 'handoff' // vote saved; screen is covered until the next person taps
  | 'result' // all votes in (or closed early); show ranking
  | 'decided' // a winner is fixed

export type DecidedBy = 'votes' | 'random' | 'manual'

export type QuickVoteSetup = {
  question: string
  options: string[]
  voterCount: number
  multiple: boolean
}

export type QuickVoteSession = {
  question: string
  options: string[]
  voterCount: number
  /** true = each voter can pick several options. Runoff rounds are always single choice. */
  multiple: boolean
  round: number
  /** Option indexes that can be voted for in this round (all at first; tied ones in a runoff). */
  candidates: number[]
  /** One entry per voter in this round: the option indexes they picked. */
  ballots: number[][]
  phase: Phase
  winner: number | null
  decidedBy: DecidedBy | null
}

export type RankedOption = { index: number; votes: number }

export type QuickVoteAction =
  | { type: 'vote'; choices: number[] }
  | { type: 'next' }
  | { type: 'undo' }
  | { type: 'closeEarly' }
  | { type: 'pickRandom'; random?: (max: number) => number }
  | { type: 'pickManual'; index: number }
  | { type: 'runoff' }

/** Cleans the setup form. Returns null if it is not valid. */
export function normalizeSetup(setup: QuickVoteSetup): QuickVoteSetup | null {
  const options = setup.options.map((o) => o.trim()).filter((o) => o.length > 0)
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) return null
  if (!Number.isInteger(setup.voterCount)) return null
  if (setup.voterCount < MIN_VOTERS || setup.voterCount > MAX_VOTERS) return null
  return { ...setup, question: setup.question.trim(), options }
}

export function createSession(setup: QuickVoteSetup): QuickVoteSession {
  const clean = normalizeSetup(setup)
  if (!clean) throw new Error('Invalid quick vote setup')
  return {
    ...clean,
    round: 1,
    candidates: clean.options.map((_, i) => i),
    ballots: [],
    phase: 'voting',
    winner: null,
    decidedBy: null,
  }
}

/** Votes per candidate, highest first. Equal votes keep the original option order. */
export function rank(session: QuickVoteSession): RankedOption[] {
  const votes = new Map<number, number>(session.candidates.map((i) => [i, 0]))
  for (const ballot of session.ballots) {
    for (const choice of new Set(ballot)) {
      if (votes.has(choice)) votes.set(choice, votes.get(choice)! + 1)
    }
  }
  return session.candidates
    .map((index) => ({ index, votes: votes.get(index)! }))
    .sort((a, b) => b.votes - a.votes || a.index - b.index)
}

/** Option indexes sharing the highest vote count (more than one = tie). */
export function leaders(session: QuickVoteSession): number[] {
  const ranked = rank(session)
  const top = ranked[0]?.votes ?? 0
  return ranked.filter((r) => r.votes === top).map((r) => r.index)
}

/** Whether a ballot is allowed in the current round. */
export function isValidBallot(session: QuickVoteSession, choices: number[]): boolean {
  if (choices.length === 0) return false
  if (new Set(choices).size !== choices.length) return false
  if (!choices.every((c) => session.candidates.includes(c))) return false
  const multiple = session.multiple && session.round === 1
  return multiple || choices.length === 1
}

/**
 * Random integer in [0, max) from the browser's secure random source.
 * Uses rejection sampling so every value is equally likely.
 */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new Error(`max must be a positive integer, got ${max}`)
  const limit = Math.floor(0x1_0000_0000 / max) * max
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    if (buffer[0] < limit) return buffer[0] % max
  }
}

function finishVoting(session: QuickVoteSession): QuickVoteSession {
  const top = leaders(session)
  if (top.length === 1) return { ...session, phase: 'decided', winner: top[0], decidedBy: 'votes' }
  return { ...session, phase: 'result' }
}

export function quickVoteReducer(session: QuickVoteSession, action: QuickVoteAction): QuickVoteSession {
  switch (action.type) {
    case 'vote': {
      if (session.phase !== 'voting' || !isValidBallot(session, action.choices)) return session
      const next = { ...session, ballots: [...session.ballots, [...action.choices]] }
      return next.ballots.length >= next.voterCount ? finishVoting(next) : { ...next, phase: 'handoff' }
    }
    case 'next':
      return session.phase === 'handoff' ? { ...session, phase: 'voting' } : session
    case 'undo':
      // Only the person who just voted can take it back, before the phone is passed on.
      if (session.phase !== 'handoff' || session.ballots.length === 0) return session
      return { ...session, ballots: session.ballots.slice(0, -1), phase: 'voting' }
    case 'closeEarly':
      if (session.phase !== 'handoff' || session.ballots.length === 0) return session
      return finishVoting(session)
    case 'pickRandom': {
      if (session.phase !== 'result') return session
      const tied = leaders(session)
      const pick = (action.random ?? secureRandomInt)(tied.length)
      return { ...session, phase: 'decided', winner: tied[pick], decidedBy: 'random' }
    }
    case 'pickManual':
      if (session.phase !== 'result' || !leaders(session).includes(action.index)) return session
      return { ...session, phase: 'decided', winner: action.index, decidedBy: 'manual' }
    case 'runoff': {
      if (session.phase !== 'result') return session
      return { ...session, round: session.round + 1, candidates: leaders(session), ballots: [], phase: 'voting' }
    }
  }
}

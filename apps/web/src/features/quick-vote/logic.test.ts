import { describe, expect, it } from 'vitest'
import {
  createSession,
  isValidBallot,
  leaders,
  normalizeSetup,
  quickVoteReducer,
  rank,
  secureRandomInt,
  type QuickVoteAction,
  type QuickVoteSession,
} from './logic'

const base = { question: ' ไปไหนดี ', options: ['หมูกระทะ', 'ชาบู', 'ส้มตำ'], voterCount: 4, multiple: false }

function run(session: QuickVoteSession, actions: QuickVoteAction[]): QuickVoteSession {
  return actions.reduce(quickVoteReducer, session)
}

/** Each voter votes, then the phone is passed on (except after the last vote). */
function voteAll(session: QuickVoteSession, ballots: number[][]): QuickVoteSession {
  return ballots.reduce((s, choices) => {
    const afterVote = quickVoteReducer(s, { type: 'vote', choices })
    return afterVote.phase === 'handoff' ? quickVoteReducer(afterVote, { type: 'next' }) : afterVote
  }, session)
}

describe('normalizeSetup', () => {
  it('trims text and drops empty options', () => {
    expect(normalizeSetup({ ...base, options: [' A ', '', '  ', 'B'] })).toEqual({
      ...base,
      question: 'ไปไหนดี',
      options: ['A', 'B'],
    })
  })
  it('rejects fewer than 2 options, more than 6, and bad voter counts', () => {
    expect(normalizeSetup({ ...base, options: ['A', ' '] })).toBeNull()
    expect(normalizeSetup({ ...base, options: ['1', '2', '3', '4', '5', '6', '7'] })).toBeNull()
    expect(normalizeSetup({ ...base, voterCount: 1 })).toBeNull()
    expect(normalizeSetup({ ...base, voterCount: 31 })).toBeNull()
    expect(normalizeSetup({ ...base, voterCount: 2.5 })).toBeNull()
  })
})

describe('voting flow', () => {
  it('covers the screen after each vote and decides a clear winner automatically', () => {
    let s = createSession(base)
    s = quickVoteReducer(s, { type: 'vote', choices: [1] })
    expect(s.phase).toBe('handoff')
    s = voteAll(quickVoteReducer(s, { type: 'next' }), [[1], [0], [2]])
    expect(s.phase).toBe('decided')
    expect(s.winner).toBe(1)
    expect(s.decidedBy).toBe('votes')
  })

  it('ranks by votes, ties keep option order, and never reveals who voted', () => {
    const s = voteAll(createSession(base), [[2], [0], [2], [0]])
    expect(rank(s)).toEqual([
      { index: 0, votes: 2 },
      { index: 2, votes: 2 },
      { index: 1, votes: 0 },
    ])
    expect(s.phase).toBe('result')
    expect(leaders(s)).toEqual([0, 2])
  })

  it('undo removes only the last vote and lets the same person vote again', () => {
    let s = run(createSession(base), [{ type: 'vote', choices: [0] }, { type: 'next' }, { type: 'vote', choices: [1] }])
    s = quickVoteReducer(s, { type: 'undo' })
    expect(s.ballots).toEqual([[0]])
    expect(s.phase).toBe('voting')
    expect(quickVoteReducer(s, { type: 'undo' })).toBe(s) // cannot undo someone else's vote
  })

  it('close early counts only the votes so far', () => {
    const s = run(createSession(base), [{ type: 'vote', choices: [2] }, { type: 'closeEarly' }])
    expect(s.phase).toBe('decided')
    expect(s.winner).toBe(2)
  })

  it('ignores invalid ballots', () => {
    const s = createSession(base)
    expect(quickVoteReducer(s, { type: 'vote', choices: [] })).toBe(s)
    expect(quickVoteReducer(s, { type: 'vote', choices: [0, 1] })).toBe(s) // single choice mode
    expect(quickVoteReducer(s, { type: 'vote', choices: [9] })).toBe(s)
  })
})

describe('multiple choice', () => {
  it('allows several picks per voter in round 1, but not duplicates', () => {
    const s = createSession({ ...base, multiple: true, voterCount: 2 })
    expect(isValidBallot(s, [0, 2])).toBe(true)
    expect(isValidBallot(s, [0, 0])).toBe(false)
    const done = voteAll(s, [[0, 2], [2]])
    expect(done.winner).toBe(2)
  })
})

describe('ties', () => {
  const tied = () => voteAll(createSession(base), [[0], [1], [0], [1]])

  it('random pick only chooses among tied options', () => {
    const first = quickVoteReducer(tied(), { type: 'pickRandom', random: () => 0 })
    const second = quickVoteReducer(tied(), { type: 'pickRandom', random: () => 1 })
    expect([first.winner, second.winner]).toEqual([0, 1])
    expect(first.decidedBy).toBe('random')
  })

  it('manual pick must be one of the tied options', () => {
    expect(quickVoteReducer(tied(), { type: 'pickManual', index: 2 }).phase).toBe('result')
    expect(quickVoteReducer(tied(), { type: 'pickManual', index: 1 }).winner).toBe(1)
  })

  it('runoff votes again among tied options only, single choice', () => {
    const s = quickVoteReducer(tied(), { type: 'runoff' })
    expect(s.round).toBe(2)
    expect(s.candidates).toEqual([0, 1])
    expect(s.ballots).toEqual([])
    expect(isValidBallot(s, [2])).toBe(false)
    expect(voteAll(s, [[1], [1], [0], [1]]).winner).toBe(1)
  })
})

describe('secureRandomInt', () => {
  it('stays in range and reaches every value', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 500; i++) {
      const n = secureRandomInt(3)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(3)
      seen.add(n)
    }
    expect(seen).toEqual(new Set([0, 1, 2]))
  })
  it('rejects invalid max', () => {
    expect(() => secureRandomInt(0)).toThrow()
    expect(() => secureRandomInt(1.5)).toThrow()
  })
})

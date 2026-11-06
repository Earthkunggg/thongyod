import { describe, expect, it } from 'vitest'
import { allVoted, foldFingers, tally, topVoted, validVote } from './roomLogic'

describe('party room rules', () => {
  it('checks answers per game', () => {
    expect(validVote('mostLikely', 'u2', ['u1', 'u2'])).toBe(true)
    expect(validVote('mostLikely', 'u9', ['u1', 'u2'])).toBe(false)
    expect(validVote('neverHave', 'have', [])).toBe(true)
    expect(validVote('neverHave', 'u1', ['u1'])).toBe(false)
  })

  it('tallies ใครน่าจะ… votes and finds the top (with ties)', () => {
    const t = tally('mostLikely', new Map([['a', 'b'], ['b', 'c'], ['c', 'b'], ['d', 'c']]))
    expect(t.tally).toEqual({ b: 2, c: 2 })
    expect(topVoted(t.tally).sort()).toEqual(['b', 'c'])
    expect(topVoted({})).toEqual([])
  })

  it('lists who has done it in ไม่เคย… and folds their fingers', () => {
    const t = tally('neverHave', new Map([['a', 'have'], ['b', 'never'], ['c', 'have']]))
    expect(t.tally).toEqual({ have: 2, never: 1 })
    expect(t.haveIds).toEqual(['a', 'c'])
    expect(foldFingers({ a: 1, b: 5 }, t.haveIds)).toEqual({ a: 0, b: 5, c: 4 })
    expect(foldFingers({ a: 0 }, ['a'])).toEqual({ a: 0 })
  })

  it('knows when everyone answered', () => {
    expect(allVoted(['a', 'b'], new Map([['a', 'x']]))).toBe(false)
    expect(allVoted(['a', 'b'], new Map([['a', 'x'], ['b', 'y']]))).toBe(true)
  })
})

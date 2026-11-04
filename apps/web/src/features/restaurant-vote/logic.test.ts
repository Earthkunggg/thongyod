import { describe, expect, it } from 'vitest'
import { acceptedByAll, createRoom, roomOutcome } from './logic'

function withBallots(ballots: number[][]) {
  const room = createRoom(['ตามสั่ง', 'ส้มตำ', 'ชาบู', 'คาเฟ่'], 3)!
  return { ...room, ballots, phase: 'result' as const }
}

describe('createRoom', () => {
  it('cleans options and checks limits', () => {
    expect(createRoom([' a ', 'a', 'b'], 2)?.options).toEqual(['a', 'b'])
    expect(createRoom(['a'], 2)).toBeNull()
    expect(createRoom(Array.from({ length: 13 }, (_, i) => `r${i}`), 2)).toBeNull()
    expect(createRoom(['a', 'b'], 1)).toBeNull()
    expect(createRoom(['a', 'b'], 31)).toBeNull()
    expect(createRoom(['a', 'b'], 3)?.multiple).toBe(true)
  })
})

describe('roomOutcome (spec §8.6)', () => {
  it('picks randomly among places everyone accepted', () => {
    const s = withBallots([[0, 1, 2], [1, 2], [2, 1, 3]])
    expect(acceptedByAll(s)).toEqual([1, 2])
    expect(roomOutcome(s, () => 0)).toEqual({ kind: 'agreed', winner: 1, pool: [1, 2] })
    expect(roomOutcome(s, () => 1)).toEqual({ kind: 'agreed', winner: 2, pool: [1, 2] })
  })
  it('no common place → the most-voted ones', () => {
    const s = withBallots([[0], [1, 0], [1, 2]])
    expect(acceptedByAll(s)).toEqual([])
    expect(roomOutcome(s)).toEqual({ kind: 'noCommon', top: [0, 1], votes: 2 })
  })
  it('works when the group closed early (only voters who voted count)', () => {
    const s = withBallots([[3], [3, 0]])
    expect(roomOutcome(s, () => 0)).toEqual({ kind: 'agreed', winner: 3, pool: [3] })
  })
})

import { describe, expect, it } from 'vitest'
import { TABOO_PACKS } from '@/config/games/taboo'
import { cycleVerdict, isGameOver, leaders, turnInfo, turnPoints } from './logic'

describe('taboo', () => {
  it('scores a turn', () => {
    const a = [
      { word: 'a', verdict: 'correct' as const },
      { word: 'b', verdict: 'correct' as const },
      { word: 'c', verdict: 'taboo' as const },
      { word: 'd', verdict: 'skip' as const },
    ]
    expect(turnPoints(a)).toBe(1)
    expect(turnPoints(a, true)).toBe(0)
  })

  it('rotates teams and rounds', () => {
    expect(turnInfo(0, 3)).toEqual({ team: 0, round: 0 })
    expect(turnInfo(4, 3)).toEqual({ team: 1, round: 1 })
    expect(isGameOver(5, 3, 2)).toBe(false)
    expect(isGameOver(6, 3, 2)).toBe(true)
  })

  it('finds leaders including ties', () => {
    expect(leaders([3, 5, 5])).toEqual([1, 2])
  })

  it('cycles verdicts', () => {
    expect(cycleVerdict('correct')).toBe('skip')
    expect(cycleVerdict('skip')).toBe('taboo')
    expect(cycleVerdict('taboo')).toBe('correct')
  })

  it('cards are well formed and unique', () => {
    const cards = TABOO_PACKS.flatMap((p) => p.cards)
    expect(cards.length).toBeGreaterThanOrEqual(180)
    expect(new Set(cards.map((c) => c.word)).size).toBe(cards.length)
    for (const c of cards) {
      expect(c.forbidden).toHaveLength(4)
      expect(c.forbidden).not.toContain(c.word)
      expect(new Set(c.forbidden).size).toBe(4)
      // Parts of the word are forbidden by the rules anyway (#87): the 4 slots go to real associations.
      for (const f of c.forbidden) {
        expect(c.word.includes(f) || f.includes(c.word), `${c.word} / ${f}`).toBe(false)
      }
    }
  })
})

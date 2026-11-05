import { describe, expect, it } from 'vitest'
import { MOST_LIKELY, NEVER_HAVE } from '@/config/games/party'
import { cardsOf, validPacks } from './logic'

describe('party deck', () => {
  it('collects cards of the chosen packs only', () => {
    const cards = cardsOf(MOST_LIKELY, ['food'])
    expect(cards.length).toBe(MOST_LIKELY.find((p) => p.id === 'food')!.cards.length)
    expect(cards.every((c) => c.pack === 'food')).toBe(true)
  })

  it('uses every pack when nothing valid is chosen', () => {
    expect(cardsOf(NEVER_HAVE, ['nope']).length).toBe(NEVER_HAVE.reduce((n, p) => n + p.cards.length, 0))
  })

  it('drops unknown pack ids', () => {
    expect(validPacks(MOST_LIKELY, ['x', 'trip'])).toEqual(['trip'])
    expect(validPacks(MOST_LIKELY, [])).toHaveLength(MOST_LIKELY.length)
  })

  it('has big, duplicate-free content (repeats get boring)', () => {
    for (const packs of [MOST_LIKELY, NEVER_HAVE]) {
      const all = packs.flatMap((p) => p.cards)
      expect(all.length).toBeGreaterThanOrEqual(200)
      for (const p of packs) expect(new Set(p.cards).size).toBe(p.cards.length)
    }
  })
})

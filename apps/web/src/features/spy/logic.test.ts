import { describe, expect, it } from 'vitest'
import { SPY_PAIRS, SPY_PLACES } from '@/config/games/spy'
import { clampPlayers, dealSpy, maxSpies } from './logic'

const seq = (values: number[]) => {
  let i = 0
  return (max: number) => values[i++ % values.length] % max
}

describe('spy', () => {
  it('limits spies by player count', () => {
    expect(maxSpies(3)).toBe(1)
    expect(maxSpies(6)).toBe(2)
    expect(maxSpies(12)).toBe(3)
  })

  it('deals exactly the asked number of spies (capped)', () => {
    const r = dealSpy({ players: 6, spies: 2, mode: 'places', item: 'วัด' })
    expect(r.spies.filter(Boolean)).toHaveLength(2)
    expect(r.secret).toBe('วัด')
    expect(r.spyWord).toBeNull()
    expect(dealSpy({ players: 4, spies: 3, mode: 'places', item: 'x' }).spies.filter(Boolean)).toHaveLength(1)
  })

  it('gives the spy the other word in pairs mode, either way round', () => {
    const a = dealSpy({ players: 4, spies: 1, mode: 'pairs', item: ['ชาบู', 'สุกี้'] }, seq([0, 0, 0, 0, 0, 0]))
    expect([a.secret, a.spyWord]).toEqual(['ชาบู', 'สุกี้'])
    const b = dealSpy({ players: 4, spies: 1, mode: 'pairs', item: ['ชาบู', 'สุกี้'] }, seq([0, 0, 0, 1, 0]))
    expect([b.secret, b.spyWord]).toEqual(['สุกี้', 'ชาบู'])
  })

  it('every player can be the spy (fair)', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 300; i++) seen.add(dealSpy({ players: 5, spies: 1, mode: 'places', item: 'x' }).spies.indexOf(true))
    expect(seen.size).toBe(5)
  })

  it('clamps player count', () => {
    expect(clampPlayers(1)).toBe(3)
    expect(clampPlayers(40)).toBe(12)
  })

  it('has plenty of unique content', () => {
    const places = SPY_PLACES.flatMap((p) => p.items)
    expect(places.length).toBeGreaterThanOrEqual(100)
    expect(new Set(places).size).toBe(places.length)
    const pairs = SPY_PAIRS.flatMap((p) => p.items)
    expect(pairs.length).toBeGreaterThanOrEqual(100)
    for (const [a, b] of pairs) expect(a).not.toBe(b)
  })
})

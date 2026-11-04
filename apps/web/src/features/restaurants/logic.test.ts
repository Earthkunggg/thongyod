import { describe, expect, it } from 'vitest'
import { NO_FILTERS, applyFilters, drawNext, exclude, filterKey, newRound, remaining, restart, type Restaurant } from './logic'

const r = (id: string, over: Partial<Restaurant> = {}): Restaurant => ({ id, name: id, category: 'tamsang', budget: 'le60', note: '', visits: 0, createdAt: '2026-11-05T00:00:00Z', ...over })
const list = [r('a'), r('b', { category: 'cafe', budget: 'b61to150' }), r('c', { category: 'bakery', budget: null }), r('d', { visits: 2, budget: 'gt300' })]
const first = () => 0

describe('applyFilters', () => {
  it('no filters = everything', () => {
    expect(applyFilters(list, NO_FILTERS).map((x) => x.id)).toEqual(['a', 'b', 'c', 'd'])
  })
  it('group, category, budget, unknown price, only new', () => {
    expect(applyFilters(list, { ...NO_FILTERS, groups: ['drinks'] }).map((x) => x.id)).toEqual(['b'])
    expect(applyFilters(list, { ...NO_FILTERS, categories: ['tamsang'] }).map((x) => x.id)).toEqual(['a', 'd'])
    expect(applyFilters(list, { ...NO_FILTERS, budgets: ['le60'] }).map((x) => x.id)).toEqual(['a', 'c'])
    expect(applyFilters(list, { ...NO_FILTERS, budgets: ['le60'], includeUnknownPrice: false }).map((x) => x.id)).toEqual(['a'])
    expect(applyFilters(list, { ...NO_FILTERS, includeUnknownPrice: false }).map((x) => x.id)).toEqual(['a', 'b', 'd'])
    expect(applyFilters(list, { ...NO_FILTERS, onlyNew: true }).map((x) => x.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('filterKey', () => {
  it('ignores order, changes with any filter', () => {
    expect(filterKey({ ...NO_FILTERS, categories: ['cafe', 'tamsang'] })).toBe(filterKey({ ...NO_FILTERS, categories: ['tamsang', 'cafe'] }))
    expect(filterKey(NO_FILTERS)).not.toBe(filterKey({ ...NO_FILTERS, onlyNew: true }))
  })
})

describe('rounds (spec §8.4)', () => {
  const cands = [r('A'), r('B'), r('C'), r('D')]
  it('never repeats inside a round, then reports exhausted', () => {
    let round = newRound('k')
    const seen: string[] = []
    for (let i = 0; i < 4; i++) {
      const d = drawNext(cands, round, first)
      if (d.kind !== 'picked') throw new Error('expected a pick')
      seen.push(d.id)
      round = d.round
    }
    expect(new Set(seen).size).toBe(4)
    expect(drawNext(cands, round, first).kind).toBe('exhausted')
    expect(remaining(cands, round)).toBe(0)
  })
  it('B picked → next pick comes from A, C, D', () => {
    const round = { key: 'k', shown: ['B'], excluded: [] }
    for (const n of [0, 1, 2]) {
      const d = drawNext(cands, round, () => n)
      expect(d.kind === 'picked' && d.id).not.toBe('B')
    }
  })
  it('excluded places stay out after a restart; shown ones come back', () => {
    let round = exclude({ key: 'k', shown: ['A', 'B'], excluded: [] }, 'C')
    round = restart(round)
    expect(round.shown).toEqual([])
    expect(remaining(cands, round)).toBe(3)
  })
  it('no candidates = empty (never widens filters by itself)', () => {
    expect(drawNext([], newRound('k')).kind).toBe('empty')
  })
})

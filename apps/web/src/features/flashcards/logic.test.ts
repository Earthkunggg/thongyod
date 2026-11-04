import { describe, expect, it } from 'vitest'
import { applyRound, BACK_MAX, knownPercent, makeCard, parseBulk, studyOrder, type Deck } from './logic'

const deck = (over: Partial<Deck> = {}): Deck => ({
  id: 'd1',
  title: 'ศัพท์',
  cards: [
    { id: 'a', front: 'apple', back: 'แอปเปิล' },
    { id: 'b', front: 'book', back: 'หนังสือ' },
    { id: 'c', front: 'cat', back: 'แมว' },
  ],
  known: [],
  createdAt: '2026-11-05T00:00:00.000Z',
  studiedAt: null,
  ...over,
})

describe('makeCard', () => {
  it('trims, cuts long text and rejects empty sides', () => {
    expect(makeCard('x', '  hi ', ' สวัสดี ')).toEqual({ id: 'x', front: 'hi', back: 'สวัสดี' })
    expect(makeCard('x', 'hi', '   ')).toBeNull()
    expect([...makeCard('x', 'a', 'ก'.repeat(500))!.back]).toHaveLength(BACK_MAX)
  })
})

describe('parseBulk', () => {
  it('reads tab, dash, en dash, equals and colon lines; skips the rest', () => {
    const text = 'apple - แอปเปิล\nbook\tหนังสือ\ncat – แมว\ndog = หมา\nH2O : น้ำ\nno separator\n - empty front\nwell-known - รู้จักกันดี'
    expect(parseBulk(text)).toEqual([
      ['apple', 'แอปเปิล'],
      ['book', 'หนังสือ'],
      ['cat', 'แมว'],
      ['dog', 'หมา'],
      ['H2O', 'น้ำ'],
      ['well-known', 'รู้จักกันดี'],
    ])
  })
})

describe('studyOrder', () => {
  it('keeps order, filters to unknown cards, and shuffles fairly', () => {
    expect(studyOrder(deck(), false, false).map((c) => c.id)).toEqual(['a', 'b', 'c'])
    expect(studyOrder(deck({ known: ['b'] }), true, false).map((c) => c.id)).toEqual(['a', 'c'])
    const shuffled = studyOrder(deck(), false, true, () => 0).map((c) => c.id)
    expect([...shuffled].sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('applyRound and knownPercent', () => {
  it('adds known, removes unknown, drops deleted cards', () => {
    const d = applyRound(deck({ known: ['c', 'gone'] }), ['a'], ['c'], new Date('2026-11-05T10:00:00Z'))
    expect(d.known).toEqual(['a'])
    expect(d.studiedAt).toBe('2026-11-05T10:00:00.000Z')
    expect(knownPercent(d)).toBe(33)
    expect(knownPercent(deck({ cards: [] }))).toBe(0)
  })
})

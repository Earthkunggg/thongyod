import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addSeen, freshFirst, gameDeck, loadSeen } from './deck'

const first = () => 0

describe('freshFirst', () => {
  it('puts unseen items before seen ones and drops duplicates', () => {
    const out = freshFirst(['a', 'b', 'c', 'a', ' '], (x) => x, new Set(['a']), first)
    expect(out).toHaveLength(3)
    expect(out.at(-1)).toBe('a')
    expect(new Set(out)).toEqual(new Set(['a', 'b', 'c']))
  })
})

describe('addSeen', () => {
  it('keeps the newest keys within the limit, moving repeats to the end', () => {
    expect(addSeen(['a', 'b', 'c'], ['a', 'd'], 3)).toEqual(['c', 'a', 'd'])
  })
})

describe('gameDeck', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    })
  })

  it('remembers what was shown across visits', () => {
    const deck = gameDeck('t')
    deck.markSeen(['x', 'y'])
    const order = gameDeck('t').order(['x', 'y', 'z'], (s) => s)
    expect(order[0]).toBe('z')
  })

  it('starts the pool over once everything was seen', () => {
    const deck = gameDeck('t')
    deck.markSeen(['x', 'y', 'other'])
    expect(deck.order(['x', 'y'], (s) => s)).toHaveLength(2)
    expect(loadSeen('t')).toEqual(['other'])
  })
})

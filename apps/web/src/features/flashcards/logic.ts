// Swipe flashcards (DECISIONS #46 phase B). Pure logic, tested in logic.test.ts.
import { secureRandomInt } from '@/lib/random'

export const FRONT_MAX = 80
export const BACK_MAX = 200
export const TITLE_MAX = 40
export const CARDS_MAX = 300

export type Card = { id: string; front: string; back: string }
export type Deck = {
  id: string
  title: string
  cards: Card[]
  /** Card ids answered "รู้แล้ว" the last time they were studied. */
  known: string[]
  createdAt: string
  studiedAt: string | null
}

const cut = (text: string, max: number) => [...text.trim()].slice(0, max).join('')

/** A card from two fields, or null when either side is empty. Text is trimmed and cut to the limits. */
export function makeCard(id: string, front: string, back: string): Card | null {
  const f = cut(front, FRONT_MAX)
  const b = cut(back, BACK_MAX)
  return f && b ? { id, front: f, back: b } : null
}

/** Separators for pasting many cards: tab, " - ", " – ", " = ", " : " (first one on the line wins). */
const SEPARATOR = /\t| [-–=:] /

/** Pasted lines → [front, back] pairs. Lines without a separator or with an empty side are skipped. */
export function parseBulk(text: string): Array<[string, string]> {
  const pairs: Array<[string, string]> = []
  for (const line of text.split(/\r?\n/)) {
    const match = SEPARATOR.exec(line)
    if (!match) continue
    const front = line.slice(0, match.index).trim()
    const back = line.slice(match.index + match[0].length).trim()
    if (front && back) pairs.push([front, back])
  }
  return pairs
}

/** Order for a study round: all cards, or only the ones not known yet; optionally shuffled. */
export function studyOrder(deck: Deck, onlyUnknown: boolean, shuffled: boolean, random: (max: number) => number = secureRandomInt): Card[] {
  const known = new Set(deck.known)
  const cards = onlyUnknown ? deck.cards.filter((c) => !known.has(c.id)) : [...deck.cards]
  if (!shuffled) return cards
  for (let i = cards.length - 1; i > 0; i--) {
    const j = random(i + 1)
    ;[cards[i], cards[j]] = [cards[j], cards[i]]
  }
  return cards
}

/** After a round: cards answered known are added, cards answered unknown are removed. Deleted cards are dropped. */
export function applyRound(deck: Deck, knownIds: readonly string[], unknownIds: readonly string[], now: Date): Deck {
  const exists = new Set(deck.cards.map((c) => c.id))
  const known = new Set(deck.known.filter((id) => exists.has(id)))
  for (const id of knownIds) if (exists.has(id)) known.add(id)
  for (const id of unknownIds) known.delete(id)
  return { ...deck, known: deck.cards.map((c) => c.id).filter((id) => known.has(id)), studiedAt: now.toISOString() }
}

/** Share of cards known, 0–100 (whole number). */
export function knownPercent(deck: Deck): number {
  if (deck.cards.length === 0) return 0
  const ids = new Set(deck.cards.map((c) => c.id))
  return Math.round((deck.known.filter((id) => ids.has(id)).length / deck.cards.length) * 100)
}

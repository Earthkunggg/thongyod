// Flashcard decks on this device (UX_GUIDELINES §12: say "เก็บในเครื่องนี้"; sync to the account later).
import { useSyncExternalStore } from 'react'
import { CARDS_MAX, makeCard, type Card, type Deck } from './logic'

const KEY = 'thongyod-flashcards'
const listeners = new Set<() => void>()

function valid(value: unknown): value is Deck {
  const d = value as Deck
  return typeof d?.id === 'string' && typeof d.title === 'string' && Array.isArray(d.cards) && Array.isArray(d.known) && typeof d.createdAt === 'string'
}

function read(): Deck[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter(valid).map((d) => ({
      ...d,
      cards: d.cards.map((c: Card) => makeCard(c?.id, c?.front ?? '', c?.back ?? '')).filter((c): c is Card => c !== null && typeof c.id === 'string').slice(0, CARDS_MAX),
      known: d.known.filter((id): id is string => typeof id === 'string'),
      studiedAt: typeof d.studiedAt === 'string' ? d.studiedAt : null,
    }))
  } catch {
    return []
  }
}

let decks = read()

function write(next: Deck[]) {
  decks = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // Storage full or blocked: changes last until the page closes.
  }
  listeners.forEach((l) => l())
}

export function useDecks(): Deck[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => decks,
  )
}

export { randomId as newId } from '@/lib/id'

/** The deck as saved right now (for undo callbacks that run later). */
export const getDeck = (id: string): Deck | undefined => decks.find((d) => d.id === id)

/** Adds or replaces a deck (newest first for new ones). */
export function saveDeck(deck: Deck): void {
  write(decks.some((d) => d.id === deck.id) ? decks.map((d) => (d.id === deck.id ? deck : d)) : [deck, ...decks])
}

export function deleteDeck(id: string): Deck | undefined {
  const removed = decks.find((d) => d.id === id)
  write(decks.filter((d) => d.id !== id))
  return removed
}

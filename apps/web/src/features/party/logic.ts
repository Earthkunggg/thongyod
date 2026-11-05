// Party deck (ใครน่าจะ…, ไม่เคย…). Pure logic, tested in logic.test.ts.
import type { PartyPack, PartyPackId } from '@/config/games/party'

export type PartyCard = { pack: PartyPackId; text: string }

/** All cards of the chosen packs (unknown ids ignored; nothing chosen = every pack). */
export function cardsOf(packs: readonly PartyPack[], chosen: readonly string[]): PartyCard[] {
  const use = packs.filter((p) => chosen.includes(p.id))
  return (use.length ? use : packs).flatMap((p) => p.cards.map((text) => ({ pack: p.id, text })))
}

/** Keep only ids that exist; nothing saved yet = every pack (most variety). */
export function validPacks(packs: readonly PartyPack[], chosen: readonly string[]): string[] {
  const ok = chosen.filter((id) => packs.some((p) => p.id === id))
  return ok.length ? ok : packs.map((p) => p.id)
}

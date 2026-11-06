// Party games in a room (many phones). Server-side rules, used by the mock and mirrored by the real API.
// Tested in roomLogic.test.ts.

export const START_FINGERS = 5
export type PartyGame = 'mostLikely' | 'neverHave'

/** Is this answer allowed? ใครน่าจะ…: a player in the room. ไม่เคย…: 'have' | 'never'. */
export function validVote(game: PartyGame, choice: string, playerIds: readonly string[]): boolean {
  return game === 'mostLikely' ? playerIds.includes(choice) : choice === 'have' || choice === 'never'
}

/** Count answers. ไม่เคย… also lists who has done it. */
export function tally(game: PartyGame, votes: ReadonlyMap<string, string>): { tally: Record<string, number>; haveIds: string[] } {
  const out: Record<string, number> = game === 'neverHave' ? { have: 0, never: 0 } : {}
  const haveIds: string[] = []
  for (const [voter, choice] of votes) {
    out[choice] = (out[choice] ?? 0) + 1
    if (game === 'neverHave' && choice === 'have') haveIds.push(voter)
  }
  return { tally: out, haveIds }
}

/** Fold one finger for everyone who has done it (never below 0). */
export function foldFingers(fingers: Readonly<Record<string, number>>, haveIds: readonly string[]): Record<string, number> {
  const next = { ...fingers }
  for (const id of haveIds) next[id] = Math.max(0, (next[id] ?? START_FINGERS) - 1)
  return next
}

/** Players with the most votes (ties included), for ใครน่าจะ…. */
export function topVoted(t: Readonly<Record<string, number>>): string[] {
  const best = Math.max(0, ...Object.values(t))
  return best === 0 ? [] : Object.keys(t).filter((id) => t[id] === best)
}

/** Everyone in the room has answered. */
export const allVoted = (playerIds: readonly string[], votes: ReadonlyMap<string, string>) => playerIds.every((id) => votes.has(id))

// คำต้องห้าม (taboo). Pure logic, tested in logic.test.ts.

export type TabooVerdict = 'correct' | 'taboo' | 'skip'
export type TabooAnswer = { word: string; verdict: TabooVerdict }

export const TEAM_COUNTS = [2, 3, 4] as const
export const TURN_SECONDS = [60, 90] as const
export const ROUNDS = [2, 3, 5] as const

/** Points for one turn: correct +1, said a forbidden word −1, skip 0 (or −1 when skips cost). */
export function turnPoints(answers: readonly TabooAnswer[], skipCosts = false): number {
  return answers.reduce((n, a) => n + (a.verdict === 'correct' ? 1 : a.verdict === 'taboo' ? -1 : skipCosts ? -1 : 0), 0)
}

/** Turn order: team 0, 1, …, then round 2. Returns the team and round (both 0-based) of turn `turn`. */
export function turnInfo(turn: number, teams: number): { team: number; round: number } {
  return { team: turn % teams, round: Math.floor(turn / teams) }
}

export const isGameOver = (turnsPlayed: number, teams: number, rounds: number) => turnsPlayed >= teams * rounds

/** Index of the leading team(s). */
export function leaders(scores: readonly number[]): number[] {
  const best = Math.max(...scores)
  return scores.flatMap((s, i) => (s === best ? [i] : []))
}

/** Cycle a verdict when the team fixes a mistake on the summary screen. */
export function cycleVerdict(v: TabooVerdict): TabooVerdict {
  return v === 'correct' ? 'skip' : v === 'skip' ? 'taboo' : 'correct'
}

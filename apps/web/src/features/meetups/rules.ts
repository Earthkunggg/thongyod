// Display-side copies of meetup rules. The server enforces them; these only decide what to show.

/** Answers lock this long after the start time (decision #33). */
export const ANSWER_LOCK_MINUTES = 10

export function isAnswerLocked(startsAt: Date, now: Date): boolean {
  return now.getTime() > startsAt.getTime() + ANSWER_LOCK_MINUTES * 60_000
}

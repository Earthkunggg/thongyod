// Same rules as the backend (decision #40). The server still checks; this only gives instant feedback.

export const NAME_MIN = 2
export const NAME_MAX = 20
export const BIO_MAX = 80

const NAME_PATTERN = /^[\p{Script=Thai}A-Za-z0-9 ._-]+$/u

/** Counts characters the way the server does (Unicode code points). */
export const charCount = (text: string) => [...text].length

export type NameProblem = 'too_short' | 'too_long' | 'bad_chars' | null

export function checkDisplayName(raw: string): NameProblem {
  const name = raw.trim()
  if (charCount(name) < NAME_MIN) return 'too_short'
  if (charCount(name) > NAME_MAX) return 'too_long'
  if (!NAME_PATTERN.test(name)) return 'bad_chars'
  return null
}

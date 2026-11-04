// Faces of the layered pet: which eyes + mouth (+ effect) each expression uses. Pure data.
import type { Effect, EyeSet, MouthId } from './dragon'

export type Expression = 'sulky' | 'neutral' | 'happy' | 'excited' | 'sleepy' | 'sad' | 'surprised' | 'angry' | 'nervous'

export type Face = { eyes: EyeSet; mouth: MouthId; effect?: Effect }

/** ขี้งอน is the dragon's personality (#47), so its resting face is sulky. */
export const EXPRESSIONS: Record<Expression, Face> = {
  sulky: { eyes: 'sulky', mouth: 'pout' },
  neutral: { eyes: 'open', mouth: 'cat' },
  happy: { eyes: 'happy', mouth: 'laugh' },
  excited: { eyes: 'sparkle', mouth: 'grin_wide' },
  sleepy: { eyes: 'closed', mouth: 'tiny' },
  sad: { eyes: 'teary', mouth: 'wavy' },
  surprised: { eyes: 'open', mouth: 'shout' },
  angry: { eyes: 'sulky', mouth: 'pout', effect: 'anger' },
  nervous: { eyes: 'open', mouth: 'wavy', effect: 'sweat' },
}

export const EXPRESSION_IDS = Object.keys(EXPRESSIONS) as Expression[]

/** Eyes that look closed already: no blinking on top of them. */
export const NO_BLINK: ReadonlySet<EyeSet> = new Set(['closed', 'happy'])

/** Eye offset toward a point (pointer), clamped to `max` reference units. Pure, tested. */
export function lookOffset(dx: number, dy: number, max = 4): [number, number] {
  const length = Math.hypot(dx, dy)
  if (length < 1) return [0, 0]
  const scale = Math.min(max, length / 40) / length
  return [Math.round(dx * scale * 10) / 10, Math.round(dy * scale * 10) / 10]
}

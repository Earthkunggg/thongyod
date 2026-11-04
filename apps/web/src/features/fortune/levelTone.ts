import type { Tone } from '@/lib/tones'
import type { Level } from './logic'

/** Badge color for each fortune level (card and history). */
export const LEVEL_TONE = { great: 'accent', good: 'success', fair: 'info', careful: 'danger' } as const satisfies Record<Level, Tone>

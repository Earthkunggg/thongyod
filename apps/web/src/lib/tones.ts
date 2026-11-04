// Theme-aware colors. Values live in index.css per theme (default / cute) and mode (light / dark).
// RULE: never use Tailwind palette colors (amber-100, rose-700 …) in components — they ignore the theme.
// - Tone = meaning (warning, success, info, danger, accent, neutral).
// - Tint = a category color with no meaning (tools, people, highlight cards), 8 of them.

export type Tone = 'warning' | 'success' | 'info' | 'danger' | 'accent' | 'neutral'

/** Background + text for a pill, badge or tile. */
export const TONE_CLASS: Record<Tone, string> = {
  warning: 'bg-tone-warning text-tone-warning-foreground',
  success: 'bg-tone-success text-tone-success-foreground',
  info: 'bg-tone-info text-tone-info-foreground',
  danger: 'bg-tone-danger text-tone-danger-foreground',
  accent: 'bg-tone-accent text-tone-accent-foreground',
  neutral: 'bg-muted text-muted-foreground',
}

/** Text only (e.g. a warning line). */
export const TONE_TEXT: Record<Tone, string> = {
  warning: 'text-tone-warning-foreground',
  success: 'text-tone-success-foreground',
  info: 'text-tone-info-foreground',
  danger: 'text-tone-danger-foreground',
  accent: 'text-tone-accent-foreground',
  neutral: 'text-muted-foreground',
}

// Full class strings (not built from parts) so Tailwind can find them.
const TINTS = [
  'bg-tint-1 text-tint-1-foreground',
  'bg-tint-2 text-tint-2-foreground',
  'bg-tint-3 text-tint-3-foreground',
  'bg-tint-4 text-tint-4-foreground',
  'bg-tint-5 text-tint-5-foreground',
  'bg-tint-6 text-tint-6-foreground',
  'bg-tint-7 text-tint-7-foreground',
  'bg-tint-8 text-tint-8-foreground',
]

/** Category color n (1–8, wraps around). */
export function tintClass(n: number): string {
  return TINTS[(((n - 1) % TINTS.length) + TINTS.length) % TINTS.length]
}

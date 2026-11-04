// One color per person, so the same friend is easy to spot on items, the summary and the receipt.
// Uses the theme's category tints (lib/tones), so it matches the default and cute themes in light and dark.
import { tintClass } from '@/lib/tones'

export function personColor(index: number): string {
  return tintClass(index + 1)
}

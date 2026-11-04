// One color per person, so the same friend is easy to spot on items, the summary and the receipt.
// Light tints with dark text: readable in light and dark mode.
const PERSON_COLORS = [
  'bg-rose-200 text-rose-900',
  'bg-amber-200 text-amber-900',
  'bg-sky-200 text-sky-900',
  'bg-lime-200 text-lime-900',
  'bg-violet-200 text-violet-900',
  'bg-teal-200 text-teal-900',
  'bg-orange-200 text-orange-900',
  'bg-pink-200 text-pink-900',
]

export function personColor(index: number): string {
  return PERSON_COLORS[index % PERSON_COLORS.length]
}

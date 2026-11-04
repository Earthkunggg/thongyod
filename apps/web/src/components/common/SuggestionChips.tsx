import type { LucideIcon } from 'lucide-react'

type SuggestionChipsProps = {
  items: string[]
  onPick: (item: string) => void
  label: string
  /** Optional icon for each item (same order as items). */
  icons?: (LucideIcon | undefined)[]
}

// Row of small tappable suggestions that fill a field, e.g. meetup title ideas.
export function SuggestionChips({ items, onPick, label, icons }: SuggestionChipsProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item, i) => {
        const Icon = icons?.[i]
        return (
          <button
            key={item}
            type="button"
            onClick={() => onPick(item)}
            className="flex h-9 items-center gap-1.5 rounded-full border bg-card px-3 text-sm active:bg-muted"
          >
            {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden="true" />}
            {item}
          </button>
        )
      })}
    </div>
  )
}

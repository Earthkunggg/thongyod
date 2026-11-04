// Row of small tappable suggestions that fill a field, e.g. meetup title ideas.
export function SuggestionChips({ items, onPick, label }: { items: string[]; onPick: (item: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="h-9 rounded-full border bg-card px-3 text-sm active:bg-muted"
        >
          {item}
        </button>
      ))}
    </div>
  )
}

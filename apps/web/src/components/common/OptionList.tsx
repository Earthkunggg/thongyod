import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string; description?: string }

type OptionListProps<T extends string> = {
  options: Option<T>[]
  value: T | null
  onChange: (value: T) => void
  /** Accessible name of the list, e.g. "เลือกแก๊ง". */
  label: string
}

// Pick one item from a vertical list (radio list inside a card), e.g. choose a gang.
// For 2-4 short options in a row, use SegmentedChoice instead.
export function OptionList<T extends string>({ options, value, onChange, label }: OptionListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="rounded-xl border bg-card px-4 py-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className="flex min-h-14 w-full items-center gap-3 py-2 text-left active:opacity-70 [&+&]:border-t"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{option.label}</span>
              {option.description && <span className="block truncate text-xs text-muted-foreground">{option.description}</span>}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border-2',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
              )}
            >
              {selected && <Check className="size-4" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

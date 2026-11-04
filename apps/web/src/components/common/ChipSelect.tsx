import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string; icon?: LucideIcon }

type ChipSelectProps<T extends string> = {
  options: readonly Option<T>[]
  /** Selected values. Empty = "any" when used as a filter. */
  value: readonly T[]
  onChange: (next: T[]) => void
  /** Accessible name of the group. */
  label: string
  /** One choice only (radio). Default: many (checkboxes). */
  single?: boolean
}

// Wrap of rounded chips to pick one or many (filters, categories). For 2–4 equal options use SegmentedChoice.
export function ChipSelect<T extends string>({ options, value, onChange, label, single = false }: ChipSelectProps<T>) {
  return (
    <div className="flex flex-wrap gap-2" role={single ? 'radiogroup' : 'group'} aria-label={label}>
      {options.map(({ value: v, label: text, icon: Icon }) => {
        const on = value.includes(v)
        return (
          <button
            key={v}
            type="button"
            role={single ? 'radio' : 'checkbox'}
            aria-checked={on}
            onClick={() => onChange(single ? [v] : on ? value.filter((x) => x !== v) : [...value, v])}
            className={cn(
              'flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
              on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card active:bg-muted',
            )}
          >
            {Icon && <Icon className="size-4" aria-hidden="true" />}
            {text}
          </button>
        )
      })}
    </div>
  )
}

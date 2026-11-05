import type { LucideIcon } from 'lucide-react'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

export type PackOption = { id: string; icon: LucideIcon; tint: number; name: string; hint?: string; meta?: string }

type PackPickerProps = {
  packs: PackOption[]
  /** Selected ids. One id when `multiple` is off. */
  value: string[]
  onChange: (value: string[]) => void
  /** Pick several packs (at least one stays selected). */
  multiple?: boolean
  label: string
}

// Content packs as tinted tiles (heads-up, party games, spy, taboo …).
export function PackPicker({ packs, value, onChange, multiple, label }: PackPickerProps) {
  function toggle(id: string) {
    if (!multiple) return onChange([id])
    const on = value.includes(id)
    if (on && value.length === 1) return
    onChange(on ? value.filter((v) => v !== id) : [...value, id])
  }
  return (
    <div className="grid grid-cols-2 gap-2 px-3" role={multiple ? 'group' : 'radiogroup'} aria-label={label}>
      {packs.map((pack) => {
        const selected = value.includes(pack.id)
        const Icon = pack.icon
        return (
          <button
            key={pack.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={selected}
            onClick={() => toggle(pack.id)}
            className={cn(
              'flex min-h-24 flex-col items-start gap-1 rounded-2xl p-3 text-left transition-[transform,box-shadow] active:scale-[0.98]',
              tintClass(pack.tint),
              selected ? 'ring-3 ring-primary' : 'opacity-75 ring-0',
            )}
          >
            <Icon className="size-6" aria-hidden="true" />
            <span className="mt-1 text-sm font-medium">{pack.name}</span>
            {pack.hint && <span className="text-xs opacity-80">{pack.hint}</span>}
            {pack.meta && <span className="mt-auto text-[11px] opacity-80">{pack.meta}</span>}
          </button>
        )
      })}
    </div>
  )
}

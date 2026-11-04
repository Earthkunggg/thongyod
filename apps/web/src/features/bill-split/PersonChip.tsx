import type { LucideIcon } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import { personColor } from './colors'

type Props = {
  index: number
  name: string
  pressed: boolean
  onClick: () => void
  /** Icon shown when chosen. */
  icon: LucideIcon
  disabled?: boolean
}

// Avatar + name pill used to pick who paid / who is treated. Chosen = filled border + icon.
export function PersonChip({ index, name, pressed, onClick, icon: Icon, disabled }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 max-w-full items-center gap-2 rounded-full border-2 py-0.5 pr-3 pl-0.5 text-sm transition-colors active:scale-95 disabled:opacity-40',
        pressed ? 'border-primary bg-primary/10 font-medium' : 'border-transparent bg-muted/60',
      )}
    >
      <Avatar name={name} className={cn('size-8 text-xs', personColor(index))} />
      <span className="truncate">{name}</span>
      {pressed && <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />}
    </button>
  )
}

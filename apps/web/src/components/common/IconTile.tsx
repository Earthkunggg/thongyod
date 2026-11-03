import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconTileProps = {
  icon: LucideIcon
  /** accent = group / important items, neutral = solo / secondary items. */
  tone?: 'accent' | 'neutral'
  className?: string
}

// Rounded square with an icon, used at the start of rows and tool cards.
export function IconTile({ icon: Icon, tone = 'accent', className }: IconTileProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg',
        tone === 'accent' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="size-5" />
    </span>
  )
}

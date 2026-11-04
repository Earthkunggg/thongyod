import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { TONE_CLASS, type Tone } from '@/lib/tones'
import { cn } from '@/lib/utils'

// Small rounded label with a meaning color (status, level, streak). Colors follow the theme.
export function Badge({ tone = 'neutral', icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', TONE_CLASS[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  )
}

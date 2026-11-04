import type { ReactNode, UIEventHandler } from 'react'
import { cn } from '@/lib/utils'

// Horizontal row that scrolls sideways with snapping (cards peek in from the right).
// Children should be `shrink-0 snap-start`. Hidden scrollbar; works with touch, trackpad and keyboard.
export function HScroll({ children, label, className, onScroll }: { children: ReactNode; label: string; className?: string; onScroll?: UIEventHandler<HTMLDivElement> }) {
  return (
    <div
      role="group"
      aria-label={label}
      onScroll={onScroll}
      className={cn('flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
    >
      {children}
    </div>
  )
}

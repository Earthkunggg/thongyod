import type { CSSProperties, ReactNode } from 'react'
import { Drawer } from '@base-ui/react/drawer'
import { cn } from '@/lib/utils'

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** Small control on the right of the title (e.g. "อ่านทั้งหมด"). */
  action?: ReactNode
  /** Pinned under the scrolling content (e.g. "ดูทั้งหมด"). */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/** Opens at ~62% of the screen; drag up for full height, drag down to close (like share / likes sheets on phones). */
const SNAP_POINTS = [0.62, 1]

// Sheet that slides up from the bottom (Base UI Drawer): swipe to dismiss, backdrop tap closes, focus trapped.
export function BottomSheet({ open, onOpenChange, title, action, footer, children, className }: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={SNAP_POINTS}>
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-black/45 transition-opacity duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0" />
        <Drawer.Viewport className="fixed inset-0 z-50 flex touch-none items-end justify-center">
          <Drawer.Popup
            className={cn(
              'relative flex max-h-[calc(100dvh-var(--top-margin))] min-h-0 w-full max-w-md touch-none flex-col rounded-t-3xl border-t bg-popover text-popover-foreground shadow-lg outline-none',
              '[padding-bottom:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))] [transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]',
              'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)] data-swiping:duration-0',
              'data-ending-style:[padding-bottom:0] data-ending-style:[transform:translateY(calc(100%+2px))] data-starting-style:[padding-bottom:0] data-starting-style:[transform:translateY(calc(100%+2px))]',
              'data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
              className,
            )}
            style={{ '--top-margin': 'calc(env(safe-area-inset-top) + 0.75rem)' } as CSSProperties}
          >
            <div className="shrink-0 touch-none px-4 pt-2.5 pb-2 select-none">
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-muted-foreground/30" aria-hidden="true" />
              <div className="flex min-h-9 items-center gap-2">
                <Drawer.Title className="flex-1 text-lg font-medium">{title}</Drawer.Title>
                {action}
              </div>
            </div>
            <Drawer.Content className="min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain">{children}</Drawer.Content>
            {footer && <div className="shrink-0 border-t px-4 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">{footer}</div>}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

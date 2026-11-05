import type { ReactNode } from 'react'

// The one hero action pinned in the thumb zone (setup screens). Leave pb-28 on the page so nothing hides under it.
export function BottomAction({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md gap-2 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
      {children}
    </div>
  )
}

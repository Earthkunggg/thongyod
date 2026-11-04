import { Outlet, ScrollRestoration } from 'react-router'
import { BottomNav } from './BottomNav'

// Page frame for every tab: content area + fixed bottom tab bar.
// Content is limited to phone width and centered on larger screens.
export function AppShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background">
      {/* Bottom padding = tab bar height + phone safe area, so content is never hidden. */}
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      {/* Back button returns to the same scroll position (decision #43). */}
      <ScrollRestoration />
      </main>
      <BottomNav />
    </div>
  )
}

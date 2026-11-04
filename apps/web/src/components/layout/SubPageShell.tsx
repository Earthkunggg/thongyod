import { Outlet, ScrollRestoration } from 'react-router'

// Frame for full-screen pages opened from a tab (tools, details).
// No bottom tab bar, so the page gets the whole screen; pages show a back button instead.
export function SubPageShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-[env(safe-area-inset-bottom)]">
      <Outlet />
      {/* Back button returns to the same scroll position (decision #43). */}
      <ScrollRestoration />
    </div>
  )
}

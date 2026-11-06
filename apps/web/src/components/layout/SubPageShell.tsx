import { Outlet, ScrollRestoration, useLocation } from 'react-router'

// Frame for full-screen pages opened from a tab (tools, details).
// No bottom tab bar, so the page gets the whole screen; pages show a back button instead.
export function SubPageShell() {
  // Re-keyed per path so each page fades in (search params like ?tab keep the page).
  const { pathname } = useLocation()
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-[env(safe-area-inset-bottom)]">
      <div key={pathname} className="page-enter">
        <Outlet />
      </div>
      {/* Back button returns to the same scroll position (decision #43). */}
      <ScrollRestoration />
    </div>
  )
}

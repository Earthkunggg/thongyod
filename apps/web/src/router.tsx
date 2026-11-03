import { createBrowserRouter, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { SubPageShell } from '@/components/layout/SubPageShell'
import { TOOLS } from '@/config/tools'
import { ExplorePage } from '@/pages/ExplorePage'
import { GangsPage } from '@/pages/GangsPage'
import { HomePage } from '@/pages/HomePage'
import { MeetupDetailPage } from '@/pages/MeetupDetailPage'
import { MePage } from '@/pages/MePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PetPage } from '@/pages/PetPage'
import { QuickVotePage } from '@/pages/QuickVotePage'
import { ToolPlaceholderPage } from '@/pages/ToolPlaceholderPage'

/** Paths that already have their own page (tabs). */
const TAB_PATHS = ['/', '/gangs', '/explore', '/pet', '/me']

// Ready tools without a real page yet get a placeholder.
// When a tool page is built, add its route above this list and it will be skipped here.
const BUILT_TOOL_PATHS: string[] = ['/quick-vote']
const placeholderToolRoutes: RouteObject[] = TOOLS.filter(
  (tool) => tool.status === 'ready' && tool.to && !TAB_PATHS.includes(tool.to) && !BUILT_TOOL_PATHS.includes(tool.to),
).map((tool) => ({ path: tool.to!.slice(1), element: <ToolPlaceholderPage toolId={tool.id} /> }))

// Paths are English; labels shown to users come from i18n.
export const router = createBrowserRouter([
  {
    // Tab pages: with the bottom tab bar.
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'gangs', element: <GangsPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'pet', element: <PetPage /> },
      { path: 'me', element: <MePage /> },
    ],
  },
  {
    // Full-screen pages: no tab bar, back button in the header.
    element: <SubPageShell />,
    children: [
      { path: 'quick-vote', element: <QuickVotePage /> },
      { path: 'meetups/:id', element: <MeetupDetailPage /> },
      ...placeholderToolRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

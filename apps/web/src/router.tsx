import { createBrowserRouter, createHashRouter, Navigate, type RouteObject } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { SubPageShell } from '@/components/layout/SubPageShell'
import { TOOLS } from '@/config/tools'
import { EditProfilePage } from '@/pages/EditProfilePage'
import { ExplorePage } from '@/pages/ExplorePage'
import { AddFriendPage } from '@/pages/AddFriendPage'
import { BillPage } from '@/pages/BillPage'
import { BillsPage } from '@/pages/BillsPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { CreateMeetupPage } from '@/pages/CreateMeetupPage'
import { FortuneHistoryPage } from '@/pages/FortuneHistoryPage'
import { FortunePage } from '@/pages/FortunePage'
import { FriendQrPage } from '@/pages/FriendQrPage'
import { FriendsPage } from '@/pages/FriendsPage'
import { GangsLayout } from '@/pages/GangsLayout'
import { GangsPage } from '@/pages/GangsPage'
import { HomePage } from '@/pages/HomePage'
import { InvitesPage } from '@/pages/InvitesPage'
import { MeetupDetailPage } from '@/pages/MeetupDetailPage'
import { MutualFriendsPage } from '@/pages/MutualFriendsPage'
import { MyMeetupsPage } from '@/pages/MyMeetupsPage'
import { MePage } from '@/pages/MePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PendingPage } from '@/pages/PendingPage'
import { PetPage } from '@/pages/PetPage'
import { ProfileListPage } from '@/pages/ProfileListPage'
import { QuickVotePage } from '@/pages/QuickVotePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ToolPlaceholderPage } from '@/pages/ToolPlaceholderPage'
import { UpdatesPage } from '@/pages/UpdatesPage'
import { UserProfilePage } from '@/pages/UserProfilePage'
import { WelcomePage } from '@/pages/WelcomePage'
import { WheelPage } from '@/pages/WheelPage'
import { OnboardingGate } from '@/features/onboarding/OnboardingGate'

/** Paths that already have their own page (tabs). */
const TAB_PATHS = ['/', '/gangs', '/explore', '/pet', '/me']

// Ready tools without a real page yet get a placeholder.
// When a tool page is built, add its route above this list and it will be skipped here.
const BUILT_TOOL_PATHS: string[] = ['/quick-vote', '/meetups/new', '/wheel', '/bills', '/fortune', '/meetups']
const placeholderToolRoutes: RouteObject[] = TOOLS.filter(
  (tool) => tool.status === 'ready' && tool.to && !TAB_PATHS.includes(tool.to) && !BUILT_TOOL_PATHS.includes(tool.to),
).map((tool) => ({ path: tool.to!.slice(1), element: <ToolPlaceholderPage toolId={tool.id} /> }))

// Paths are English; labels shown to users come from i18n.
const createRouter = import.meta.env.VITE_DEPLOY_MOCKS === 'true' ? createHashRouter : createBrowserRouter
export const router = createRouter([
  {
    // Tab pages: with the bottom tab bar.
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <OnboardingGate><HomePage /></OnboardingGate> },
      {
        path: 'gangs',
        element: <GangsLayout />,
        children: [
          { index: true, element: <GangsPage /> },
          { path: 'friends', element: <FriendsPage /> },
        ],
      },
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
      { path: 'wheel', element: <WheelPage /> },
      { path: 'bills', element: <BillsPage /> },
      { path: 'bills/new', element: <Navigate to="/bills" replace /> },
      { path: 'bills/:id', element: <BillPage /> },
      { path: 'fortune', element: <FortunePage /> },
      { path: 'fortune/history', element: <FortuneHistoryPage /> },
      { path: 'pending', element: <PendingPage /> },
      { path: 'updates', element: <UpdatesPage /> },
      { path: 'meetups', element: <MyMeetupsPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'invites', element: <InvitesPage /> },
      { path: 'meetups/new', element: <CreateMeetupPage /> },
      { path: 'meetups/:id', element: <MeetupDetailPage /> },
      { path: 'friends/qr', element: <FriendQrPage /> },
      { path: 'add/:code', element: <AddFriendPage /> },
      { path: 'u/:userId', element: <UserProfilePage /> },
      { path: 'u/:userId/mutual', element: <MutualFriendsPage /> },
      { path: 'u/:userId/titles', element: <ProfileListPage kind="titles" /> },
      { path: 'u/:userId/gangs', element: <ProfileListPage kind="gangs" /> },
      { path: 'me/edit', element: <EditProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'welcome', element: <WelcomePage /> },
      ...placeholderToolRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

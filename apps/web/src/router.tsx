import { createBrowserRouter } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ExplorePage } from '@/pages/ExplorePage'
import { GangsPage } from '@/pages/GangsPage'
import { HomePage } from '@/pages/HomePage'
import { MePage } from '@/pages/MePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PetPage } from '@/pages/PetPage'

// All pages with the bottom tab bar live under AppShell.
// Paths are English; labels shown to users are Thai (see BottomNav).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'gangs', element: <GangsPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'pet', element: <PetPage /> },
      { path: 'me', element: <MePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

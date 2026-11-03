import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { queryClient } from './api/queryClient'
import { Toaster } from './components/ui/toaster'
import './i18n' // must load before any component renders text
import './index.css'
import { router } from './router'

// The dev mock API runs inside the Vite dev server (see vite.config.ts), so nothing starts here.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)

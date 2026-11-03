import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './client'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // data counts as fresh for 30 s: fewer requests on tab switches
      // Retry once for network/server errors. 4xx (not found, no permission) will not change: show it now.
      retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
      refetchOnWindowFocus: true,
    },
  },
})

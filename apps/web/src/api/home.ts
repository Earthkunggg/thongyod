import { useQuery } from '@tanstack/react-query'
import type { HomeSummary } from '@thongyod/shared'
import { apiFetch } from './client'

export const homeKeys = { all: ['home'] as const }

export function useHome() {
  return useQuery({ queryKey: homeKeys.all, queryFn: () => apiFetch<HomeSummary>('/home') })
}

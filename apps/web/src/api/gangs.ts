import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CursorPage, GangSummary } from './types'

export const gangKeys = { mine: ['gangs', 'mine'] as const }

/** All my gangs (follows every page; people are in a few gangs). For long gang lists use useCursorList. */
export function useMyGangs() {
  return useQuery({
    queryKey: gangKeys.mine,
    queryFn: async () => {
      const all: GangSummary[] = []
      let cursor: string | null = null
      do {
        const page: CursorPage<GangSummary> = await apiFetch<CursorPage<GangSummary>>(
          `/gangs?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        )
        all.push(...page.items)
        cursor = page.nextCursor
      } while (cursor)
      return all
    },
  })
}

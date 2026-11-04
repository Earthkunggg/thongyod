import { useQuery } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useCursorList } from './paging'
import type { CursorPage, GangDetail, GangSummary } from './types'

export const gangKeys = {
  mine: ['gangs', 'mine'] as const,
  list: (q: string) => ['gangs', 'list', q] as const,
  detail: (id: string) => ['gangs', 'detail', id] as const,
}

/** My gangs page by page, `q` = part of the name (#43). For the gangs tab. */
export function useGangList(q: string) {
  return useCursorList<GangSummary>(gangKeys.list(q), '/gangs', { q })
}

/** One gang: members, upcoming meetups, titles (provisional contract, see GangDetail). */
export function useGang(id: string) {
  return useQuery({ queryKey: gangKeys.detail(id), queryFn: () => apiFetch<GangDetail>(`/gangs/${id}`), enabled: id !== '' })
}

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

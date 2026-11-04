import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { CursorPage } from './types'

/** Default page size for growing lists (decision #43). */
export const PAGE_SIZE = 20

/**
 * A list loaded page by page (`{ items, nextCursor }`). Empty-string params are left out.
 * Use with <InfiniteList>.
 */
export function useCursorList<T>(key: QueryKey, path: string, params: Record<string, string> = {}) {
  return useInfiniteQuery({
    queryKey: key,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams({ limit: String(PAGE_SIZE) })
      for (const [name, value] of Object.entries(params)) if (value !== '') search.set(name, value)
      if (pageParam) search.set('cursor', pageParam)
      return apiFetch<CursorPage<T>>(`${path}?${search}`)
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}

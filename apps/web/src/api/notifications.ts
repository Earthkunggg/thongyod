import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { apiFetch } from './client'
import { PAGE_SIZE } from './paging'
import type { NotificationPage } from './types'

export const notificationKeys = { all: ['notifications'] as const }

type Pages = InfiniteData<NotificationPage, string | null>

/** My notifications, newest first, paged (#43). The first page also carries `unreadCount` for the bell. */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.all,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const search = new URLSearchParams({ limit: String(PAGE_SIZE) })
      if (pageParam) search.set('cursor', pageParam)
      return apiFetch<NotificationPage>(`/notifications?${search}`)
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}

/** Unread total for the bell (shares the list's cache: one request). */
export function useUnreadNotifications(): number {
  return useNotifications().data?.pages[0]?.unreadCount ?? 0
}

/**
 * Mark notifications read: `ids` = these ones, no ids = all. Optimistic, rolled back on error.
 * POST /notifications/read { ids? } → 204.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids?: string[]) => apiFetch<void>('/notifications/read', { method: 'POST', body: JSON.stringify(ids ? { ids } : {}) }),
    onMutate: (ids) => {
      void queryClient.cancelQueries({ queryKey: notificationKeys.all })
      const before = queryClient.getQueryData<Pages>(notificationKeys.all)
      const now = new Date().toISOString()
      queryClient.setQueryData<Pages>(notificationKeys.all, (data) => {
        if (!data) return data
        let newlyRead = 0
        const pages = data.pages.map((page) => ({
          ...page,
          items: page.items.map((n) => {
            if (n.readAt || (ids && !ids.includes(n.id))) return n
            newlyRead++
            return { ...n, readAt: now }
          }),
        }))
        const unread = ids ? Math.max(0, (data.pages[0]?.unreadCount ?? 0) - newlyRead) : 0
        return { ...data, pages: pages.map((p, i) => (i === 0 ? { ...p, unreadCount: unread } : p)) }
      })
      return { before }
    },
    onError: (_e, _ids, context) => queryClient.setQueryData(notificationKeys.all, context?.before),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

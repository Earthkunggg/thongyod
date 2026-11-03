import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MeetupResponse } from '@thongyod/shared'
import { apiFetch } from './client'
import type { MeetupDetailFull, MeetupListItem } from './types'

export const meetupKeys = {
  all: ['meetups'] as const,
  range: (from: string, to: string) => ['meetups', 'range', from, to] as const,
  detail: (id: string) => ['meetups', 'detail', id] as const,
}

/** Meetups between two instants (ISO strings). Hidden meetups are excluded. */
export function useMeetupsInRange(from: string, to: string) {
  return useQuery({
    queryKey: meetupKeys.range(from, to),
    queryFn: () =>
      apiFetch<MeetupListItem[]>(`/meetups?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  })
}

export function useMeetup(id: string) {
  return useQuery({ queryKey: meetupKeys.detail(id), queryFn: () => apiFetch<MeetupDetailFull>(`/meetups/${id}`) })
}

type ListCache = MeetupListItem[] | undefined

/** Updates every cached copy of a meetup (lists and detail) so all screens agree instantly. */
function patchMeetupEverywhere(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  patch: (m: MeetupListItem | MeetupDetailFull) => Partial<MeetupListItem & MeetupDetailFull>,
) {
  queryClient.setQueriesData<ListCache>({ queryKey: ['meetups', 'range'] }, (list) =>
    list?.map((m) => (m.id === id ? { ...m, ...patch(m) } : m)),
  )
  queryClient.setQueryData<MeetupDetailFull>(meetupKeys.detail(id), (d) => (d ? { ...d, ...patch(d) } : d))
}

/** Counts after changing my answer from `from` to `to` (null = unanswered). */
function moveCount(counts: MeetupListItem['counts'], from: MeetupResponse | null, to: MeetupResponse | null) {
  const next = { ...counts }
  if (from) next[from] = Math.max(0, next[from] - 1)
  if (to) next[to] += 1
  return next
}

/**
 * Set or clear my answer. response = null clears it (used by "ย้อนกลับ").
 * Optimistic: the screen changes first; on error everything is rolled back.
 */
export function useSetMeetupResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: MeetupResponse | null }) =>
      response
        ? apiFetch<MeetupDetailFull>(`/meetups/${id}/response`, { method: 'PUT', body: JSON.stringify({ response }) })
        : apiFetch<MeetupDetailFull>(`/meetups/${id}/response`, { method: 'DELETE' }),
    onMutate: async ({ id, response }) => {
      await queryClient.cancelQueries({ queryKey: meetupKeys.all })
      const snapshot = queryClient.getQueriesData({ queryKey: meetupKeys.all })
      patchMeetupEverywhere(queryClient, id, (m) => ({
        myResponse: response,
        counts: moveCount(m.counts, m.myResponse, response),
        ...('members' in m && { members: m.members.map((x) => (x.isMe ? { ...x, response } : x)) }),
      }))
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: meetupKeys.all }),
  })
}

/** Hide / unhide a meetup for myself ("ซ่อนนัดนี้"). */
export function useSetMeetupHidden() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
      apiFetch<MeetupDetailFull>(`/meetups/${id}/hidden`, { method: 'PUT', body: JSON.stringify({ hidden }) }),
    onMutate: async ({ id, hidden }) => {
      await queryClient.cancelQueries({ queryKey: meetupKeys.all })
      const snapshot = queryClient.getQueriesData({ queryKey: meetupKeys.all })
      patchMeetupEverywhere(queryClient, id, () => ({ myHidden: hidden }))
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: meetupKeys.all }),
  })
}

import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CreateMeetupRequest, ListMeetupsResponse, MeetupParticipationStatus, MeetupResponse } from '@thongyod/shared'
import { apiFetch } from './client'
import { profileKeys } from './profile'
import type { Me, MeetupDetailFull, MeetupListItem } from './types'

export const meetupKeys = {
  all: ['meetups'] as const,
  range: (from: string, to: string) => ['meetups', 'range', from, to] as const,
  detail: (id: string) => ['meetups', 'detail', id] as const,
}

/** Server maximum per page (decision #40). */
const PAGE_LIMIT = 100

/** Visible meetups between two instants (ISO; from inclusive, to exclusive). Follows all pages. */
export function useMeetupsInRange(from: string, to: string) {
  return useQuery({
    queryKey: meetupKeys.range(from, to),
    queryFn: async () => {
      const items: MeetupListItem[] = []
      let cursor: string | null = null
      do {
        const params = new URLSearchParams({ from, to, visibility: 'visible', limit: String(PAGE_LIMIT) })
        if (cursor) params.set('cursor', cursor)
        const page: ListMeetupsResponse = await apiFetch<ListMeetupsResponse>(`/meetups?${params}`)
        items.push(...page.items)
        cursor = page.nextCursor
      } while (cursor)
      return items
    },
  })
}

export function useMeetup(id: string) {
  return useQuery({ queryKey: meetupKeys.detail(id), queryFn: () => apiFetch<MeetupDetailFull>(`/meetups/${id}`) })
}

type ListCache = MeetupListItem[] | undefined
type Patch = (m: MeetupListItem | MeetupDetailFull) => Partial<MeetupDetailFull>

/** Updates every cached copy of a meetup (lists and detail) so all screens agree instantly. */
function patchMeetupEverywhere(queryClient: QueryClient, id: string, patch: Patch) {
  queryClient.setQueriesData<ListCache>({ queryKey: ['meetups', 'range'] }, (list) =>
    list?.map((m) => (m.id === id ? ({ ...m, ...patch(m) } as MeetupListItem) : m)),
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

/** The parts of a meetup a write needs. */
export type MeetupRef = { id: string; title: string; myResponse: MeetupResponse | null; scheduleVersion: number }

function snapshotAndCancel(queryClient: QueryClient) {
  void queryClient.cancelQueries({ queryKey: meetupKeys.all })
  return queryClient.getQueriesData({ queryKey: meetupKeys.all })
}

/**
 * Set or clear my answer. response = null clears it (used by "ย้อนกลับ").
 * Optimistic: the screen changes first; on error everything is rolled back.
 */
export function useSetMeetupResponse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ meetup, response }: { meetup: MeetupRef; response: MeetupResponse | null }) =>
      response
        ? apiFetch<MeetupDetailFull>(`/meetups/${meetup.id}/response`, {
            method: 'PUT',
            body: JSON.stringify({ response, scheduleVersion: meetup.scheduleVersion }),
          })
        : apiFetch<MeetupDetailFull>(`/meetups/${meetup.id}/response?scheduleVersion=${meetup.scheduleVersion}`, {
            method: 'DELETE',
          }),
    onMutate: ({ meetup, response }) => {
      const snapshot = snapshotAndCancel(queryClient)
      const myId = queryClient.getQueryData<Me>(profileKeys.me)?.userId
      const status: MeetupParticipationStatus = response ?? 'unanswered'
      patchMeetupEverywhere(queryClient, meetup.id, (m) => ({
        myResponse: response,
        counts: moveCount(m.counts, m.myResponse, response),
        myState: { ...m.myState, status, needsReconfirm: false },
        ...('members' in m && {
          members: m.members.map((x) => (!x.isGuest && x.userId === myId ? { ...x, response, status } : x)),
        }),
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
    mutationFn: ({ meetup, hidden }: { meetup: MeetupRef; hidden: boolean }) =>
      apiFetch<MeetupDetailFull>(`/meetups/${meetup.id}/visibility`, { method: 'PUT', body: JSON.stringify({ hidden }) }),
    onMutate: ({ meetup, hidden }) => {
      const snapshot = snapshotAndCancel(queryClient)
      patchMeetupEverywhere(queryClient, meetup.id, (m) => ({ myState: { ...m.myState, hidden } }))
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: meetupKeys.all }),
  })
}

/** Create a meetup. The server records the creator as "going". */
export function useCreateMeetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateMeetupRequest) =>
      apiFetch<MeetupDetailFull>('/meetups', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (meetup) => {
      queryClient.setQueryData(meetupKeys.detail(meetup.id), meetup)
      void queryClient.invalidateQueries({ queryKey: meetupKeys.all })
    },
  })
}

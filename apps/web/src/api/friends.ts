import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import { useCursorList } from './paging'
import type { Friend, FriendLink, FriendRequest, FriendRequests, PersonCard, UserCard } from './types'

/** Everything under 'friends' is refreshed after any friend action (lists, profiles, links). */
export const friendKeys = {
  all: ['friends'] as const,
  list: (q: string) => ['friends', 'list', q] as const,
  requests: ['friends', 'requests'] as const,
  link: ['friends', 'link'] as const,
  byHandle: (handle: string) => ['friends', 'byHandle', handle] as const,
  byLink: (code: string) => ['friends', 'byLink', code] as const,
  mutual: (userId: string) => ['friends', 'mutual', userId] as const,
}

/** My friends, paged; `q` = part of a name or handle (decision #43). */
export function useFriendList(q: string) {
  return useCursorList<Friend>(friendKeys.list(q), '/friends', { q })
}

export function useFriendRequests() {
  return useQuery({ queryKey: friendKeys.requests, queryFn: () => apiFetch<FriendRequests>('/friends/requests') })
}

/** Find a stranger by exact @handle (decision #45). Runs only when `handle` is not empty. */
export function useHandleSearch(handle: string) {
  return useQuery({
    queryKey: friendKeys.byHandle(handle),
    queryFn: () => apiFetch<UserCard>(`/users/search?handle=${encodeURIComponent(handle)}`),
    enabled: handle !== '',
  })
}

export function useMutualFriends(userId: string) {
  return useCursorList<PersonCard>(friendKeys.mutual(userId), `/users/${encodeURIComponent(userId)}/mutual-friends`)
}

/** The person who owns a friend link (/add/:code). */
export function useFriendLinkOwner(code: string) {
  return useQuery({
    queryKey: friendKeys.byLink(code),
    queryFn: () => apiFetch<UserCard>(`/friend-links/${encodeURIComponent(code)}`),
  })
}

export function useMyFriendLink() {
  return useQuery({ queryKey: friendKeys.link, queryFn: () => apiFetch<FriendLink>('/friends/link') })
}

function useFriendMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: friendKeys.all }),
  })
}

export function useRegenerateFriendLink() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiFetch<FriendLink>('/friends/link', { method: 'POST' }),
    onSuccess: (link) => queryClient.setQueryData(friendKeys.link, link),
  })
}

export function useSendFriendRequest() {
  return useFriendMutation((userId: string) =>
    apiFetch<FriendRequest>('/friends/requests', { method: 'POST', body: JSON.stringify({ userId }) }),
  )
}

export function useAcceptFriendRequest() {
  return useFriendMutation((requestId: string) =>
    apiFetch<void>(`/friends/requests/${requestId}/accept`, { method: 'POST' }),
  )
}

/** Decline (silent) or cancel a request. */
export function useDeleteFriendRequest() {
  return useFriendMutation((requestId: string) => apiFetch<void>(`/friends/requests/${requestId}`, { method: 'DELETE' }))
}

/** Silent unfriend: the other person is not told; gangs stay the same. */
export function useUnfriend() {
  return useFriendMutation((userId: string) => apiFetch<void>(`/friends/${encodeURIComponent(userId)}`, { method: 'DELETE' }))
}

export function useBlockUser() {
  return useFriendMutation((userId: string) => apiFetch<void>('/blocks', { method: 'POST', body: JSON.stringify({ userId }) }))
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { FriendLink, FriendRequest, FriendsOverview, UserCard } from './types'

export const friendKeys = {
  all: ['friends'] as const,
  overview: ['friends', 'overview'] as const,
  link: ['friends', 'link'] as const,
  search: (name: string) => ['friends', 'search', name] as const,
  byLink: (code: string) => ['friends', 'byLink', code] as const,
}

export function useFriends() {
  return useQuery({ queryKey: friendKeys.overview, queryFn: () => apiFetch<FriendsOverview>('/friends') })
}

/** Exact-name search. Runs only when `name` is not empty (after the user presses search). */
export function useUserSearch(name: string) {
  return useQuery({
    queryKey: friendKeys.search(name),
    queryFn: () => apiFetch<UserCard>(`/users/search?name=${encodeURIComponent(name)}`),
    enabled: name !== '',
  })
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

/** Every friend mutation refreshes all friend data (lists, search results, link pages). */
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Me, Profile, UpdateMeRequest } from './types'

export const profileKeys = {
  me: ['me'] as const,
  /** Profiles live under 'friends' so friend actions refresh them too. */
  profile: (userId: string) => ['friends', 'profile', userId] as const,
}

export function useMe() {
  return useQuery({ queryKey: profileKeys.me, queryFn: () => apiFetch<Me>('/me') })
}

/** `userId` = 'me' for my own profile. */
export function useProfile(userId: string) {
  return useQuery({
    queryKey: profileKeys.profile(userId),
    queryFn: () => apiFetch<Profile>(`/users/${encodeURIComponent(userId)}/profile`),
  })
}

export function useUpdateMe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateMeRequest) => apiFetch<Me>('/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: (me) => {
      queryClient.setQueryData(profileKeys.me, me)
      // My name appears in many places (members, feed): refresh everything.
      void queryClient.invalidateQueries()
    },
  })
}

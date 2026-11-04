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
export function useProfile(userId: string, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: profileKeys.profile(userId),
    queryFn: () => apiFetch<Profile>(`/users/${encodeURIComponent(userId)}/profile`),
    enabled: options.enabled ?? true,
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

export type PhotoKind = 'avatar' | 'cover'

/** Upload (file) or remove (null) my avatar / cover (decision #45). */
export function useSetPhoto(kind: PhotoKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: Blob | null) => {
      if (file === null) return apiFetch<Me>(`/me/${kind}`, { method: 'DELETE' })
      const form = new FormData()
      form.append('file', file, `${kind}.webp`)
      return apiFetch<Me>(`/me/${kind}`, { method: 'POST', body: form })
    },
    onSuccess: (me) => {
      queryClient.setQueryData(profileKeys.me, me)
      void queryClient.invalidateQueries()
    },
  })
}

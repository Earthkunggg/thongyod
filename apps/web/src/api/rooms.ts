// Game rooms: each friend plays on their own phone (PROVISIONAL contract, DECISIONS #76, docs/HANDOFF.md).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Room, RoomGame, SpyRoomSettings } from './types'

export const roomKeys = { room: (code: string) => ['rooms', code] as const }

/** Room codes are 6 digits. */
export const isRoomCode = (code: string) => /^\d{6}$/.test(code)

/** Pull a room code out of a typed code, a pasted link or a scanned QR. */
export function roomCodeFrom(text: string): string | null {
  const trimmed = text.trim()
  if (isRoomCode(trimmed)) return trimmed
  const match = trimmed.match(/games\/rooms\/(\d{6})(?:\D|$)/)
  return match ? match[1] : null
}

/** One room, refreshed every 1.5 s while the screen is open (until real-time push exists). */
export function useRoom(code: string) {
  return useQuery({
    queryKey: roomKeys.room(code),
    queryFn: () => apiFetch<Room>(`/rooms/${code}`),
    enabled: isRoomCode(code),
    refetchInterval: 1500,
    retry: (count, error) => count < 2 && !(error instanceof Error && 'status' in error && (error as { status: number }).status === 404),
  })
}

function useRoomAction<V = void>(code: string, path: (v: V) => { url: string; body?: unknown; method?: string }) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (v: V) => {
      const { url, body, method = 'POST' } = path(v)
      return apiFetch<Room>(url, { method, body: body === undefined ? undefined : JSON.stringify(body) })
    },
    onSuccess: (room) => client.setQueryData(roomKeys.room(code), room),
  })
}

export function useCreateRoom() {
  return useMutation({
    mutationFn: (body: { game: RoomGame; settings: Partial<SpyRoomSettings> }) => apiFetch<Room>('/rooms', { method: 'POST', body: JSON.stringify(body) }),
  })
}

export const useJoinRoom = (code: string) => useRoomAction(code, () => ({ url: `/rooms/${code}/join` }))
export const useLeaveRoom = (code: string) => useRoomAction(code, () => ({ url: `/rooms/${code}/leave` }))
export const useStartRound = (code: string) => useRoomAction(code, () => ({ url: `/rooms/${code}/start` }))
export const useRevealRound = (code: string) => useRoomAction(code, () => ({ url: `/rooms/${code}/reveal` }))
export const useBackToLobby = (code: string) => useRoomAction(code, () => ({ url: `/rooms/${code}/lobby` }))
export const useRoomSettings = (code: string) =>
  useRoomAction<Partial<SpyRoomSettings>>(code, (settings) => ({ url: `/rooms/${code}/settings`, method: 'PATCH', body: settings }))

/** Invite friends: they get a "ชวนเล่น" notification that opens the room. */
export function useInviteToRoom(code: string) {
  return useMutation({ mutationFn: (userIds: string[]) => apiFetch<void>(`/rooms/${code}/invite`, { method: 'POST', body: JSON.stringify({ userIds }) }) })
}

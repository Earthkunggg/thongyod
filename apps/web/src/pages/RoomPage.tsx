import { useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { DoorOpen, Users } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useMe } from '@/api/profile'
import { useJoinRoom, useLeaveRoom, useRoom } from '@/api/rooms'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { GameHeaderActions } from '@/components/games/HowToPlay'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PartyRoom } from '@/features/rooms/PartyRoom'
import { SpyRoom } from '@/features/rooms/SpyRoom'
import { showErrorToast } from '@/lib/toast'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

const JOIN_ERRORS: Record<string, string> = { ROOM_FULL: 'rooms.errors.full', ROOM_STARTED: 'rooms.errors.started', ROOM_NOT_FOUND: 'rooms.errors.notFound' }

// /games/rooms/:code — a game room (many phones). Opening the link/QR shows "เข้าห้อง" first.
export function RoomPage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const room = useRoom(code)
  const me = useMe()
  const join = useJoinRoom(code)
  const leave = useLeaveRoom(code)

  const onLeave = () => leave.mutate(undefined, { onSuccess: () => void navigate('/games/rooms', { replace: true }), onError: () => showErrorToast(t('common.saveError')) })
  const title = t('rooms.roomTitle', { code })
  let body
  if (room.isPending) body = <LoadingState rows={4} />
  else if (room.isError && !room.data) {
    body =
      room.error instanceof ApiError && room.error.status === 404 ? (
        <EmptyState title={t('rooms.errors.notFound')} hint={t('rooms.errors.notFoundHint')} action={<Button onClick={() => void navigate('/games/rooms')}>{t('rooms.zoneTitle')}</Button>} />
      ) : (
        <ErrorState onRetry={() => void room.refetch()} />
      )
  } else if (room.data && !room.data.joined) {
    const r = room.data
    const host = r.players.find((p) => p.isHost)
    body = (
      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className={cn('game-pop flex flex-col items-center gap-3 rounded-3xl p-6 text-center', tintClass(6))}>
          <Users className="size-12" aria-hidden="true" />
          <span className="text-sm opacity-80">{t('rooms.invitedBy', { name: host?.displayName ?? '' })}</span>
          <span className="text-3xl font-medium">{t(`games.list.${r.game}.title`)}</span>
          <div className="flex -space-x-2">
            {r.players.slice(0, 6).map((p) => (
              <Avatar key={p.userId} name={p.displayName} src={p.avatarUrl} className="size-9 ring-2 ring-background" />
            ))}
          </div>
          <span className="text-sm">{t('rooms.players', { count: r.players.length })}</span>
        </div>
        <Button
          size="lg"
          className="h-14 text-lg"
          disabled={join.isPending || r.state !== 'lobby'}
          onClick={() =>
            join.mutate(undefined, {
              onError: (e) => showErrorToast(t(e instanceof ApiError && e.code && JOIN_ERRORS[e.code] ? (JOIN_ERRORS[e.code] as 'rooms.errors.full') : 'common.saveError')),
            })
          }
        >
          <DoorOpen data-icon="inline-start" />
          {r.state === 'lobby' ? t('rooms.join') : t('rooms.errors.started')}
        </Button>
      </div>
    )
  } else if (room.data && me.data) {
    body = (
      room.data.game === 'spy' ? <SpyRoom room={room.data} meId={me.data.userId} onLeave={onLeave} /> : <PartyRoom room={room.data} meId={me.data.userId} onLeave={onLeave} />
    )
  } else body = <LoadingState rows={3} />

  return (
    <>
      <PageHeader title={title} subtitle={room.data ? t(`games.list.${room.data.game}.title`) : undefined} backTo="/games/rooms" action={<GameHeaderActions game={room.data?.game ?? 'spy'} />} />
      {body}
    </>
  )
}

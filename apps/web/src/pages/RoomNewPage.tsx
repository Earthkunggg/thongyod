import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCreateRoom } from '@/api/rooms'
import type { RoomGame } from '@/api/types'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadGameSettings } from '@/lib/gameSettings'
import { SPY_DEFAULTS, fixSpySettings } from '@/features/spy/settings'

const ROOM_GAMES: RoomGame[] = ['spy', 'mostLikely', 'neverHave']
const isRoomGame = (g: string | null): g is RoomGame => ROOM_GAMES.includes(g as RoomGame)

/** The packs last picked for that party game on this phone (all when none). */
function loadPartyPacks(game: 'mostLikely' | 'neverHave'): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(`thongyod-party-${game}`) ?? '[]')
    return Array.isArray(saved) ? saved.filter((v): v is string => typeof v === 'string') : []
  } catch {
    return []
  }
}

// /games/rooms/new?game=spy|mostLikely|neverHave — makes a room with my last settings for that game, then opens it.
export function RoomNewPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const create = useCreateRoom()
  const started = useRef(false)
  const game = params.get('game')

  function make() {
    if (!isRoomGame(game)) return
    let settings
    if (game === 'spy') {
      const spy = loadGameSettings('spy', SPY_DEFAULTS, fixSpySettings)
      settings = { mode: spy.mode, minutes: spy.minutes, spies: spy.spies, packs: spy.mode === 'places' ? spy.places : spy.pairs }
    } else settings = { packs: loadPartyPacks(game) }
    create.mutate({ game, settings }, { onSuccess: (room) => void navigate(`/games/rooms/${room.code}`, { replace: true }) })
  }

  useEffect(() => {
    if (started.current || !isRoomGame(game)) return
    started.current = true
    make()
    // Runs once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isRoomGame(game)) return <Navigate to="/games/rooms" replace />
  return (
    <>
      <PageHeader title={t('rooms.creating')} backTo="/games/rooms" />
      {create.isError ? <ErrorState onRetry={make} /> : <LoadingState rows={3} />}
    </>
  )
}

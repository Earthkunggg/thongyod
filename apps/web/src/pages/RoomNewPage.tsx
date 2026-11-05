import { useEffect, useRef } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useCreateRoom } from '@/api/rooms'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadGameSettings } from '@/lib/gameSettings'
import { SPY_DEFAULTS, fixSpySettings } from '@/features/spy/settings'

// /games/rooms/new?game=spy — makes a room with my last settings for that game, then opens it.
export function RoomNewPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const create = useCreateRoom()
  const started = useRef(false)
  const game = params.get('game')

  function make() {
    const spy = loadGameSettings('spy', SPY_DEFAULTS, fixSpySettings)
    create.mutate(
      { game: 'spy', settings: { mode: spy.mode, minutes: spy.minutes, spies: spy.spies, packs: spy.mode === 'places' ? spy.places : spy.pairs } },
      { onSuccess: (room) => void navigate(`/games/rooms/${room.code}`, { replace: true }) },
    )
  }

  useEffect(() => {
    if (started.current || game !== 'spy') return
    started.current = true
    make()
    // Runs once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (game !== 'spy') return <Navigate to="/games/rooms" replace />
  return (
    <>
      <PageHeader title={t('rooms.creating')} backTo="/games/rooms" />
      {create.isError ? <ErrorState onRetry={make} /> : <LoadingState rows={3} />}
    </>
  )
}

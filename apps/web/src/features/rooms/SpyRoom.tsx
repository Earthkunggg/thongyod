import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, MapPin, RotateCcw, VenetianMask } from 'lucide-react'
import { useBackToLobby, useRevealRound, useRoomSettings, useStartRound } from '@/api/rooms'
import type { SpyRoomData } from '@/api/types'
import { NumberStepper } from '@/components/common/NumberStepper'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { FlipCard } from '@/components/games/FlipCard'
import { TimerBar } from '@/components/games/TimerBar'
import { Button } from '@/components/ui/button'
import { MINUTES, maxSpies, type SpyMinutes } from '@/features/spy/logic'
import { celebrate } from '@/lib/celebrate'
import { playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { showErrorToast } from '@/lib/toast'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { PlayerList, RoomLobby } from './RoomParts'
import { useSecondsLeft } from './useSecondsLeft'
import '@/components/games/games.css'

const MIN_PLAYERS = 3

type Props = { room: SpyRoomData; meId: string; onLeave: () => void }

// สายลับ with each friend on their own phone: lobby → everyone sees only their own role → host reveals.
export function SpyRoom({ room, meId, onLeave }: Props) {
  const { t } = useTranslation()
  const sound = useGameSound('spy')
  const isHost = room.hostId === meId
  const start = useStartRound(room.code)
  const reveal = useRevealRound(room.code)
  const lobby = useBackToLobby(room.code)
  const settings = useRoomSettings(room.code)
  const [open, setOpen] = useState(false)
  const [seenRound, setSeenRound] = useState(0)
  const left = useSecondsLeft(room.round?.endsAt ?? null)
  const name = (id: string) => room.players.find((p) => p.userId === id)?.displayName ?? '?'
  const onError = () => showErrorToast(t('common.saveError'))

  // A new round hides the card again.
  if (room.round && room.round.number !== seenRound) {
    setSeenRound(room.round.number)
    setOpen(false)
  }

  if (room.state === 'lobby') {
    return (
      <RoomLobby
        room={room}
        isHost={isHost}
        minPlayers={MIN_PLAYERS}
        starting={start.isPending}
        onStart={() => {
          unlockSound()
          start.mutate(undefined, { onError })
        }}
        onLeave={onLeave}
      >
        <SegmentedChoice<'places' | 'pairs'>
          label={t('games.spy.modeTitle')}
          value={room.settings.mode}
          onChange={(mode) => settings.mutate({ mode }, { onError })}
          options={[
            { value: 'places', label: t('games.spy.modes.places'), icon: MapPin },
            { value: 'pairs', label: t('games.spy.modes.pairs'), icon: VenetianMask },
          ]}
        />
        <SegmentedChoice<string>
          label={t('games.spy.minutesTitle')}
          value={`${room.settings.minutes}`}
          onChange={(v) => settings.mutate({ minutes: Number(v) as SpyMinutes }, { onError })}
          options={MINUTES.map((m) => ({ value: `${m}`, label: t('games.minutes', { count: m }) }))}
        />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('games.spy.spies')}</span>
          <NumberStepper
            label={t('games.spy.spies')}
            value={Math.min(room.settings.spies, maxSpies(Math.max(MIN_PLAYERS, room.players.length)))}
            min={1}
            max={maxSpies(Math.max(MIN_PLAYERS, room.players.length))}
            onChange={(spies) => settings.mutate({ spies }, { onError })}
          />
        </div>
      </RoomLobby>
    )
  }

  const round = room.round
  const secret = room.mySecret
  if (room.state === 'playing' && round) {
    const placesMode = room.settings.mode === 'places'
    const isSpy = secret?.isSpy ?? false
    return (
      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{t('rooms.round', { n: round.number })}</span>
          <TimerBar left={left} total={room.settings.minutes * 60} className="flex-1" />
        </div>
        <FlipCard
          flipped={open}
          className="h-[min(44dvh,24rem)] w-full"
          front={
            <button
              type="button"
              onClick={() => {
                setOpen(true)
                if (sound) playSound('flip')
              }}
              className={cn('flex size-full flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center', tintClass(6))}
            >
              <VenetianMask className="game-breathe size-16" aria-hidden="true" />
              <span className="text-2xl font-medium">{t('games.spy.tapToSee')}</span>
              <span className="text-sm opacity-80">{t('games.spy.hideScreen')}</span>
            </button>
          }
          back={
            <div className={cn('flex size-full flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center', placesMode && isSpy ? 'bg-foreground text-background' : tintClass(5))}>
              {placesMode && isSpy ? <VenetianMask className="size-14" aria-hidden="true" /> : <MapPin className="size-10" aria-hidden="true" />}
              <span className="text-sm opacity-80">{placesMode ? (isSpy ? t('games.spy.spyHint') : t('games.spy.thePlace')) : t('games.spy.yourWord')}</span>
              <span className="text-4xl leading-tight font-medium">{placesMode && isSpy ? t('games.spy.youAreSpy') : (secret?.text ?? '')}</span>
            </div>
          }
        />
        <Button variant="outline" onClick={() => setOpen((o) => !o)}>
          {open ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
          {open ? t('rooms.hideCard') : t('games.spy.tapToSee')}
        </Button>
        <p className={cn('rounded-2xl p-4 text-center', left === 0 ? 'game-shake ' + tintClass(1) : 'bg-muted')}>
          {left === 0 ? t('games.spy.voteNow') : t('rooms.firstAsks', { name: name(round.firstPlayerId) })}
        </p>
        {isHost ? (
          <Button size="lg" className="h-14 text-lg" disabled={reveal.isPending} onClick={() => reveal.mutate(undefined, { onSuccess: () => celebrate(), onError })}>
            <VenetianMask data-icon="inline-start" />
            {t('games.spy.revealSpy')}
          </Button>
        ) : (
          <p className="text-center text-sm text-muted-foreground">{t('rooms.hostReveals', { name: name(room.hostId) })}</p>
        )}
      </div>
    )
  }

  const shown = round?.reveal
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      {shown && (
        <>
          <div className="game-pop flex flex-col items-center gap-2 rounded-3xl bg-foreground p-6 text-center text-background">
            <VenetianMask className="size-14" aria-hidden="true" />
            <span className="text-sm opacity-80">{t('games.spy.spyWas', { count: shown.spyIds.length })}</span>
            <span className="text-3xl font-medium" role="status">
              {shown.spyIds.map(name).join(', ')}
            </span>
            {secret?.isSpy && <span className={cn('mt-1 rounded-full px-3 py-1 text-xs', tintClass(3))}>{t('rooms.itWasYou')}</span>}
          </div>
          <div className={cn('grid gap-1 rounded-3xl p-5 text-center', tintClass(5))}>
            <span className="text-sm opacity-80">{room.settings.mode === 'places' ? t('games.spy.thePlace') : t('games.spy.agentsWord')}</span>
            <span className="text-3xl font-medium">{shown.secret}</span>
            {shown.spyWord && (
              <span className="mt-1 text-sm">
                {t('games.spy.spysWord')} <b className="font-medium">{shown.spyWord}</b>
              </span>
            )}
          </div>
          <PlayerList room={room} highlight={shown.spyIds} />
        </>
      )}
      {isHost ? (
        <>
          <Button size="lg" onClick={() => start.mutate(undefined, { onError })} disabled={start.isPending}>
            <RotateCcw data-icon="inline-start" />
            {t('games.playAgain')}
          </Button>
          <Button variant="outline" onClick={() => lobby.mutate(undefined, { onError })}>
            {t('rooms.backToLobby')}
          </Button>
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">{t('rooms.waitHost', { name: name(room.hostId) })}</p>
      )}
    </div>
  )
}

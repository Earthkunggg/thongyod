import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff, List, MapPin, Play, RotateCcw, Settings2, VenetianMask } from 'lucide-react'
import { NumberStepper } from '@/components/common/NumberStepper'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { BottomAction } from '@/components/games/BottomAction'
import { FlipCard } from '@/components/games/FlipCard'
import { PackPicker } from '@/components/games/PackPicker'
import { PassPhone } from '@/components/games/PassPhone'
import { TimerBar } from '@/components/games/TimerBar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SPY_PAIRS, SPY_PLACES } from '@/config/games/spy'
import { markDone } from '@/features/daily/daily'
import { celebrate } from '@/lib/celebrate'
import { gameDeck } from '@/lib/deck'
import { useGameSettings } from '@/lib/gameSettings'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { tintClass } from '@/lib/tones'
import { useCountdown } from '@/lib/useCountdown'
import { cn } from '@/lib/utils'
import { MINUTES, clampPlayers, dealSpy, maxSpies, type SpyMinutes, type SpyMode, type SpyRound } from './logic'
import '@/components/games/games.css'

type Settings = { players: number; spies: number; mode: SpyMode; places: string[]; pairs: string[]; minutes: SpyMinutes }
const DEFAULTS: Settings = { players: 5, spies: 1, mode: 'places', places: SPY_PLACES.map((p) => p.id), pairs: SPY_PAIRS.map((p) => p.id), minutes: 5 }

function fix(raw: Partial<Settings>): Settings {
  const players = clampPlayers(raw.players ?? DEFAULTS.players)
  const places = (raw.places ?? []).filter((id) => SPY_PLACES.some((p) => p.id === id))
  const pairs = (raw.pairs ?? []).filter((id) => SPY_PAIRS.some((p) => p.id === id))
  return {
    players,
    spies: Math.max(1, Math.min(raw.spies ?? 1, maxSpies(players))),
    mode: raw.mode === 'pairs' ? 'pairs' : 'places',
    places: places.length ? places : DEFAULTS.places,
    pairs: pairs.length ? pairs : DEFAULTS.pairs,
    minutes: MINUTES.includes(raw.minutes as SpyMinutes) ? (raw.minutes as SpyMinutes) : 5,
  }
}

type Stage = { kind: 'setup' } | { kind: 'pass'; player: number } | { kind: 'look'; player: number; open: boolean } | { kind: 'talk' } | { kind: 'reveal' }

const deck = gameDeck('spy')

// สายลับ on one phone: deal secret roles player by player → talk with a timer → reveal the spy.
export function SpyGame() {
  const { t } = useTranslation()
  const sound = useGameSound('spy')
  const [settings, setSettings] = useGameSettings<Settings>('spy', DEFAULTS, fix)
  const [stage, setStage] = useState<Stage>({ kind: 'setup' })
  const [round, setRound] = useState<SpyRound | null>(null)
  const [showPlaces, setShowPlaces] = useState(false)
  const [timeUp, setTimeUp] = useState(false)
  const timer = useCountdown(settings.minutes * 60, stage.kind === 'talk' && !timeUp, () => {
    setTimeUp(true)
    if (sound) playSound('end')
    buzz([80, 60, 80])
  })

  const set = (patch: Partial<Settings>) => setSettings((s) => fix({ ...s, ...patch }))
  const player = (n: number) => t('games.spy.player', { n: n + 1 })

  function deal() {
    unlockSound()
    const item =
      settings.mode === 'places'
        ? deck.order(SPY_PLACES.filter((p) => settings.places.includes(p.id)).flatMap((p) => p.items), (s) => s)[0]
        : deck.order(SPY_PAIRS.filter((p) => settings.pairs.includes(p.id)).flatMap((p) => p.items), (pair) => pair.join('|'))[0]
    deck.markSeen([typeof item === 'string' ? item : item.join('|')])
    setRound(dealSpy({ players: settings.players, spies: settings.spies, mode: settings.mode, item }))
    setTimeUp(false)
    timer.reset(settings.minutes * 60)
    setStage({ kind: 'pass', player: 0 })
    markDone('tool')
  }

  function nextAfterLook(current: number) {
    if (current + 1 < settings.players) setStage({ kind: 'pass', player: current + 1 })
    else {
      setStage({ kind: 'talk' })
      if (sound) playSound('go')
    }
  }

  function reveal() {
    setStage({ kind: 'reveal' })
    if (sound) playSound('end')
    celebrate()
  }

  if (stage.kind === 'setup' || !round) {
    const placesMode = settings.mode === 'places'
    return (
      <div className="flex flex-col gap-3 pb-28">
        <ol className="mx-3 grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          {(['deal', 'ask', 'vote'] as const).map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{i + 1}</span>
              <span>{t(`games.spy.how.${placesMode ? 'places' : 'pairs'}.${step}`)}</span>
            </li>
          ))}
        </ol>

        <SectionHeader title={t('games.spy.modeTitle')} />
        <div className="px-3">
          <SegmentedChoice<SpyMode>
            label={t('games.spy.modeTitle')}
            value={settings.mode}
            onChange={(mode) => set({ mode })}
            options={[
              { value: 'places', label: t('games.spy.modes.places'), icon: MapPin },
              { value: 'pairs', label: t('games.spy.modes.pairs'), icon: VenetianMask },
            ]}
          />
        </div>

        <div className="mx-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-start gap-2 rounded-2xl border bg-card p-3">
            <span className="text-sm font-medium">{t('games.spy.players')}</span>
            <NumberStepper label={t('games.spy.players')} value={settings.players} min={3} max={12} onChange={(players) => set({ players })} />
          </div>
          <div className="flex flex-col items-start gap-2 rounded-2xl border bg-card p-3">
            <span className="text-sm font-medium">{t('games.spy.spies')}</span>
            <NumberStepper label={t('games.spy.spies')} value={settings.spies} min={1} max={maxSpies(settings.players)} onChange={(spies) => set({ spies })} />
          </div>
        </div>

        <SectionHeader title={t('games.spy.minutesTitle')} />
        <div className="px-3">
          <SegmentedChoice<`${SpyMinutes}`>
            label={t('games.spy.minutesTitle')}
            value={`${settings.minutes}`}
            onChange={(v) => set({ minutes: Number(v) as SpyMinutes })}
            options={MINUTES.map((m) => ({ value: `${m}` as `${SpyMinutes}`, label: t('games.minutes', { count: m }) }))}
          />
        </div>

        <SectionHeader title={t('games.party.packsTitle')} />
        {placesMode ? (
          <PackPicker
            multiple
            label={t('games.party.packsTitle')}
            value={settings.places}
            onChange={(places) => set({ places })}
            packs={SPY_PLACES.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`games.spy.placePacks.${p.id}`), meta: t('games.spy.placesCount', { count: p.items.length }) }))}
          />
        ) : (
          <PackPicker
            multiple
            label={t('games.party.packsTitle')}
            value={settings.pairs}
            onChange={(pairs) => set({ pairs })}
            packs={SPY_PAIRS.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`games.spy.pairPacks.${p.id}`), meta: t('games.spy.pairsCount', { count: p.items.length }) }))}
          />
        )}

        <BottomAction>
          <Button size="lg" className="flex-1" onClick={deal}>
            <Play data-icon="inline-start" />
            {t('games.spy.deal')}
          </Button>
        </BottomAction>
      </div>
    )
  }

  if (stage.kind === 'pass') {
    return (
      <PassPhone
        key={stage.player}
        title={t('games.spy.passTo', { name: player(stage.player) })}
        hint={t('games.spy.passHint', { n: stage.player + 1, total: settings.players })}
        action={t('games.spy.imPlayer', { name: player(stage.player) })}
        onContinue={() => setStage({ kind: 'look', player: stage.player, open: false })}
      />
    )
  }

  if (stage.kind === 'look') {
    const isSpy = round.spies[stage.player]
    // Pairs mode: everyone just sees a word (the spy does not know). Places mode: the spy is told.
    const placesMode = settings.mode === 'places'
    const backText = placesMode ? (isSpy ? t('games.spy.youAreSpy') : round.secret) : isSpy ? (round.spyWord ?? '') : round.secret
    const backLabel = placesMode ? (isSpy ? t('games.spy.spyHint') : t('games.spy.thePlace')) : t('games.spy.yourWord')
    return (
      <div className="flex flex-col gap-4 px-4 pb-8">
        <p className="text-center text-sm text-muted-foreground">{player(stage.player)}</p>
        <FlipCard
          flipped={stage.open}
          className="h-[min(56dvh,32rem)] w-full"
          front={
            <button
              type="button"
              onClick={() => {
                setStage({ ...stage, open: true })
                if (sound) playSound('flip')
              }}
              className={cn('flex size-full flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center', tintClass(6))}
            >
              <VenetianMask className="game-breathe size-20" aria-hidden="true" />
              <span className="text-2xl font-medium">{t('games.spy.tapToSee')}</span>
              <span className="text-sm opacity-80">{t('games.spy.hideScreen')}</span>
            </button>
          }
          back={
            <div className={cn('flex size-full flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center', placesMode && isSpy ? 'bg-foreground text-background' : tintClass(5))}>
              {placesMode && isSpy ? <VenetianMask className="size-16" aria-hidden="true" /> : <MapPin className="size-10" aria-hidden="true" />}
              <span className="text-sm opacity-80">{backLabel}</span>
              <span className="text-4xl leading-tight font-medium">{backText}</span>
              {!placesMode && <span className="mt-2 text-xs opacity-70">{t('games.spy.pairsSecret')}</span>}
            </div>
          }
        />
        <Button
          size="lg"
          variant={stage.open ? 'default' : 'outline'}
          onClick={() => (stage.open ? nextAfterLook(stage.player) : setStage({ ...stage, open: true }))}
        >
          {stage.open ? <EyeOff data-icon="inline-start" /> : <Eye data-icon="inline-start" />}
          {stage.open ? (stage.player + 1 < settings.players ? t('games.spy.hideAndPass') : t('games.spy.startTalking')) : t('games.spy.tapToSee')}
        </Button>
      </div>
    )
  }

  if (stage.kind === 'talk') {
    const places = SPY_PLACES.filter((p) => settings.places.includes(p.id)).flatMap((p) => p.items)
    return (
      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className={cn('flex flex-col items-center gap-2 rounded-3xl p-6 text-center', timeUp ? 'game-shake ' + tintClass(1) : tintClass(6))}>
          <span className="text-sm opacity-80">{timeUp ? t('games.spy.timeUp') : t('games.spy.firstAsks')}</span>
          <span className="game-pop text-3xl font-medium">{timeUp ? t('games.spy.voteNow') : player(round.first)}</span>
          <span className="text-6xl font-medium tabular-nums">
            {Math.floor(timer.left / 60)}:{`${timer.left % 60}`.padStart(2, '0')}
          </span>
        </div>
        <TimerBar left={timer.left} total={settings.minutes * 60} />
        <ul className="grid gap-1.5 rounded-2xl border bg-card p-4 text-sm">
          {(['q1', 'q2', 'q3'] as const).map((k) => (
            <li key={k}>• {t(`games.spy.tips.${settings.mode}.${k}`)}</li>
          ))}
        </ul>
        {settings.mode === 'places' && (
          <Button variant="outline" onClick={() => setShowPlaces(true)}>
            <List data-icon="inline-start" />
            {t('games.spy.allPlaces', { count: places.length })}
          </Button>
        )}
        <Button size="lg" onClick={reveal}>
          <VenetianMask data-icon="inline-start" />
          {t('games.spy.revealSpy')}
        </Button>
        <Dialog open={showPlaces} onOpenChange={setShowPlaces}>
          <DialogContent title={t('games.spy.allPlacesTitle')} description={t('games.spy.allPlacesHint')}>
            <ul className="flex max-h-[55dvh] flex-wrap gap-1.5 overflow-y-auto">
              {places.map((p) => (
                <li key={p} className="rounded-full bg-muted px-3 py-1 text-sm">
                  {p}
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const spyNames = round.spies.flatMap((s, i) => (s ? [player(i)] : []))
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className={cn('game-pop flex flex-col items-center gap-3 rounded-3xl p-6 text-center', 'bg-foreground text-background')}>
        <VenetianMask className="size-16" aria-hidden="true" />
        <span className="text-sm opacity-80">{t('games.spy.spyWas', { count: spyNames.length })}</span>
        <span className="text-4xl font-medium" role="status">
          {spyNames.join(', ')}
        </span>
      </div>
      <div className={cn('grid gap-1 rounded-3xl p-5 text-center', tintClass(5))}>
        <span className="text-sm opacity-80">{settings.mode === 'places' ? t('games.spy.thePlace') : t('games.spy.agentsWord')}</span>
        <span className="text-3xl font-medium">{round.secret}</span>
        {round.spyWord && (
          <span className="mt-1 text-sm">
            {t('games.spy.spysWord')} <b className="font-medium">{round.spyWord}</b>
          </span>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">{t('games.spy.scoreHint')}</p>
      <Button size="lg" onClick={deal}>
        <RotateCcw data-icon="inline-start" />
        {t('games.playAgain')}
      </Button>
      <Button variant="outline" onClick={() => setStage({ kind: 'setup' })}>
        <Settings2 data-icon="inline-start" />
        {t('games.changeSettings')}
      </Button>
    </div>
  )
}

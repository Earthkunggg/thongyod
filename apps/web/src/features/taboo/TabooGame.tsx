import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, Check, Crown, Play, RotateCcw, Settings2, SkipForward } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { BottomAction } from '@/components/games/BottomAction'
import { GameCard } from '@/components/games/GameCard'
import { PackPicker } from '@/components/games/PackPicker'
import { TimerBar } from '@/components/games/TimerBar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { TABOO_PACKS, type TabooCard } from '@/config/games/taboo'
import { markDone } from '@/features/daily/daily'
import { celebrate } from '@/lib/celebrate'
import { gameDeck } from '@/lib/deck'
import { useGameSettings } from '@/lib/gameSettings'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { TONE_CLASS, tintClass } from '@/lib/tones'
import { useCountdown } from '@/lib/useCountdown'
import { cn } from '@/lib/utils'
import { ROUNDS, TEAM_COUNTS, TURN_SECONDS, cycleVerdict, isGameOver, leaders, turnInfo, turnPoints, type TabooAnswer, type TabooVerdict } from './logic'
import '@/components/games/games.css'

type Settings = { packs: string[]; teams: number; seconds: number; rounds: number; skipCosts: boolean }
const DEFAULTS: Settings = { packs: TABOO_PACKS.map((p) => p.id), teams: 2, seconds: 60, rounds: 3, skipCosts: false }
const fix = (raw: Partial<Settings>): Settings => {
  const packs = (raw.packs ?? []).filter((id) => TABOO_PACKS.some((p) => p.id === id))
  const pick = <T extends number>(list: readonly T[], v: unknown, d: T): T => (list.includes(v as T) ? (v as T) : d)
  return {
    packs: packs.length ? packs : DEFAULTS.packs,
    teams: pick(TEAM_COUNTS, raw.teams, 2),
    seconds: pick(TURN_SECONDS, raw.seconds, 60),
    rounds: pick(ROUNDS, raw.rounds, 3),
    skipCosts: raw.skipCosts === true,
  }
}

const TEAM_TINTS = [5, 3, 2, 8]
const deck = gameDeck('taboo')
type Card = TabooCard & { tint: number }
type Stage = 'setup' | 'ready' | 'play' | 'summary' | 'final'

// คำต้องห้าม: teams take turns; the clue-giver holds the phone, a rival team watches for forbidden words.
export function TabooGame() {
  const { t } = useTranslation()
  const sound = useGameSound('taboo')
  const [settings, setSettings] = useGameSettings<Settings>('taboo', DEFAULTS, fix)
  const [stage, setStage] = useState<Stage>('setup')
  const [scores, setScores] = useState<number[]>([])
  const [turn, setTurn] = useState(0)
  const [answers, setAnswers] = useState<TabooAnswer[]>([])
  const [flash, setFlash] = useState<TabooVerdict | null>(null)
  const cards = useRef<Card[]>([])
  const pos = useRef(0)
  const [card, setCard] = useState<Card | null>(null)
  const timer = useCountdown(settings.seconds, stage === 'play', () => {
    if (sound) playSound('end')
    buzz([100, 60, 100])
    setStage('summary')
  })

  const team = (i: number) => t('games.taboo.team', { n: i + 1 })
  const info = turnInfo(turn, settings.teams)

  function newGame() {
    unlockSound()
    const all = TABOO_PACKS.filter((p) => settings.packs.includes(p.id)).flatMap((p) => p.cards.map((c) => ({ ...c, tint: p.tint })))
    cards.current = deck.order(all, (c) => c.word)
    pos.current = 0
    setScores(Array.from({ length: settings.teams }, () => 0))
    setTurn(0)
    setStage('ready')
    markDone('tool')
  }

  function draw() {
    if (pos.current >= cards.current.length) {
      cards.current = deck.order(cards.current, (c) => c.word)
      pos.current = 0
    }
    const next = cards.current[pos.current++]
    deck.markSeen([next.word])
    setCard(next)
  }

  function startTurn() {
    unlockSound()
    setAnswers([])
    timer.reset(settings.seconds)
    draw()
    setStage('play')
    if (sound) playSound('go')
  }

  function answer(verdict: TabooVerdict) {
    if (!card) return
    setAnswers((a) => [...a, { word: card.word, verdict }])
    setFlash(verdict)
    window.setTimeout(() => setFlash(null), 380)
    if (sound) playSound(verdict === 'correct' ? 'correct' : verdict === 'taboo' ? 'wrong' : 'pass')
    buzz(verdict === 'taboo' ? [60, 40, 60] : 25)
    draw()
  }

  function finishTurn() {
    const points = turnPoints(answers, settings.skipCosts)
    const next = scores.map((s, i) => (i === info.team ? s + points : s))
    setScores(next)
    const played = turn + 1
    setTurn(played)
    if (isGameOver(played, settings.teams, settings.rounds)) {
      setStage('final')
      if (sound) playSound('end')
      celebrate()
    } else setStage('ready')
  }

  if (stage === 'setup') {
    return (
      <div className="flex flex-col gap-3 pb-28">
        <ol className="mx-3 grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          {(['teams', 'clue', 'watch'] as const).map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{i + 1}</span>
              <span>{t(`games.taboo.how.${step}`)}</span>
            </li>
          ))}
        </ol>
        <SectionHeader title={t('games.taboo.teamsTitle')} />
        <div className="px-3">
          <SegmentedChoice<string>
            label={t('games.taboo.teamsTitle')}
            value={`${settings.teams}`}
            onChange={(v) => setSettings((s) => fix({ ...s, teams: Number(v) }))}
            options={TEAM_COUNTS.map((n) => ({ value: `${n}`, label: t('games.taboo.teamsCount', { count: n }) }))}
          />
        </div>
        <SectionHeader title={t('games.taboo.timeTitle')} />
        <div className="px-3">
          <SegmentedChoice<string>
            label={t('games.taboo.timeTitle')}
            value={`${settings.seconds}`}
            onChange={(v) => setSettings((s) => fix({ ...s, seconds: Number(v) }))}
            options={TURN_SECONDS.map((n) => ({ value: `${n}`, label: t('headsUp.seconds', { count: n }) }))}
          />
        </div>
        <SectionHeader title={t('games.taboo.roundsTitle')} />
        <div className="px-3">
          <SegmentedChoice<string>
            label={t('games.taboo.roundsTitle')}
            value={`${settings.rounds}`}
            onChange={(v) => setSettings((s) => fix({ ...s, rounds: Number(v) }))}
            options={ROUNDS.map((n) => ({ value: `${n}`, label: t('games.taboo.roundsCount', { count: n }) }))}
          />
        </div>
        <Card className="mx-3 px-4 py-1">
          <label className="flex min-h-14 items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t('games.taboo.skipCosts')}</span>
              <span className="block text-xs text-muted-foreground">{t('games.taboo.skipCostsHint')}</span>
            </span>
            <Switch checked={settings.skipCosts} onCheckedChange={(skipCosts) => setSettings((s) => ({ ...s, skipCosts }))} aria-label={t('games.taboo.skipCosts')} />
          </label>
        </Card>
        <SectionHeader title={t('games.party.packsTitle')} />
        <PackPicker
          multiple
          label={t('games.party.packsTitle')}
          value={settings.packs}
          onChange={(packs) => setSettings((s) => fix({ ...s, packs }))}
          packs={TABOO_PACKS.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`headsUp.packs.${p.id}.name`), meta: t('games.cardsCount', { count: p.cards.length }) }))}
        />
        <BottomAction>
          <Button size="lg" className="flex-1" onClick={newGame}>
            <Play data-icon="inline-start" />
            {t('games.start')}
          </Button>
        </BottomAction>
      </div>
    )
  }

  const scoreboard = (
    <div className="grid grid-cols-2 gap-2">
      {scores.map((s, i) => (
        <div key={i} className={cn('flex items-center justify-between rounded-2xl px-4 py-3', tintClass(TEAM_TINTS[i]), i === info.team && stage === 'ready' && 'ring-3 ring-primary')}>
          <span className="text-sm font-medium">{team(i)}</span>
          <span className="text-2xl font-medium tabular-nums">{s}</span>
        </div>
      ))}
    </div>
  )

  if (stage === 'ready') {
    const watcher = (info.team + 1) % settings.teams
    return (
      <div className="flex flex-col gap-4 px-4 pt-1 pb-8">
        {scoreboard}
        <div className={cn('game-pop flex flex-col items-center gap-2 rounded-3xl p-6 text-center', tintClass(TEAM_TINTS[info.team]))}>
          <span className="text-sm opacity-80">{t('games.taboo.roundOf', { n: info.round + 1, total: settings.rounds })}</span>
          <span className="text-4xl font-medium">{t('games.taboo.teamTurn', { team: team(info.team) })}</span>
          <span className="text-sm">{t('games.taboo.readyHint', { watcher: team(watcher) })}</span>
        </div>
        <Button size="lg" className="h-14 text-lg" onClick={startTurn}>
          <Play data-icon="inline-start" />
          {t('games.taboo.go', { seconds: settings.seconds })}
        </Button>
        <Button variant="ghost" onClick={() => setStage('setup')}>
          <Settings2 data-icon="inline-start" />
          {t('games.changeSettings')}
        </Button>
      </div>
    )
  }

  if (stage === 'play' && card) {
    const points = turnPoints(answers, settings.skipCosts)
    return (
      <div className={cn('flex flex-col gap-3 px-4 pb-6', flash === 'taboo' && 'game-shake')}>
        <div className="flex items-center gap-3">
          <span className={cn('rounded-full px-3 py-1 text-sm font-medium', tintClass(TEAM_TINTS[info.team]))}>{team(info.team)}</span>
          <TimerBar left={timer.left} total={settings.seconds} className="flex-1" />
          <span className="text-lg font-medium tabular-nums" aria-label={t('games.taboo.points', { count: points })}>
            {points > 0 ? `+${points}` : points}
          </span>
        </div>
        <GameCard cardKey={card.word + answers.length} tint={card.tint} text={card.word} eyebrow={t('games.taboo.describe')} className="h-[min(56dvh,30rem)]">
          <div className="w-full rounded-2xl bg-background/75 p-3">
            <span className={cn('mb-2 flex items-center justify-center gap-1 text-xs font-medium', 'text-tone-danger-foreground')}>
              <Ban className="size-3.5" aria-hidden="true" />
              {t('games.taboo.forbidden')}
            </span>
            <ul className="grid grid-cols-2 gap-1.5 text-lg font-medium text-foreground">
              {card.forbidden.map((w) => (
                <li key={w} className="rounded-xl bg-muted px-2 py-1.5">
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </GameCard>
        <div className="grid grid-cols-3 gap-2">
          <Button size="lg" variant="outline" className={cn('h-16 flex-col gap-0.5', TONE_CLASS.danger)} onClick={() => answer('taboo')}>
            <Ban />
            <span className="text-xs">{t('games.taboo.saidIt')}</span>
          </Button>
          <Button size="lg" variant="outline" className="h-16 flex-col gap-0.5" onClick={() => answer('skip')}>
            <SkipForward />
            <span className="text-xs">{t('games.taboo.skip')}</span>
          </Button>
          <Button size="lg" className={cn('h-16 flex-col gap-0.5', TONE_CLASS.success)} onClick={() => answer('correct')}>
            <Check />
            <span className="text-xs">{t('games.taboo.correct')}</span>
          </Button>
        </div>
      </div>
    )
  }

  if (stage === 'summary') {
    const points = turnPoints(answers, settings.skipCosts)
    return (
      <div className="flex flex-col gap-4 px-4 pb-8">
        <div className={cn('game-pop flex flex-col items-center gap-1 rounded-3xl p-5 text-center', tintClass(TEAM_TINTS[info.team]))}>
          <span className="text-sm">{t('games.taboo.timeUp', { team: team(info.team) })}</span>
          <span className="text-5xl font-medium tabular-nums">{points > 0 ? `+${points}` : points}</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">{t('games.taboo.fixHint')}</p>
        <ul className="grid gap-1.5">
          {answers.map((a, i) => (
            <li key={`${a.word}-${i}`}>
              <button
                type="button"
                onClick={() => setAnswers((list) => list.map((x, j) => (j === i ? { ...x, verdict: cycleVerdict(x.verdict) } : x)))}
                className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-2.5 text-left"
              >
                <span className="font-medium">{a.word}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs', a.verdict === 'correct' ? TONE_CLASS.success : a.verdict === 'taboo' ? TONE_CLASS.danger : TONE_CLASS.neutral)}>
                  {t(`games.taboo.verdicts.${a.verdict}`)}
                </span>
              </button>
            </li>
          ))}
          {!answers.length && <li className="text-center text-sm text-muted-foreground">{t('games.taboo.noAnswers')}</li>}
        </ul>
        <Button size="lg" onClick={finishTurn}>
          {t('games.taboo.saveTurn')}
        </Button>
      </div>
    )
  }

  const top = leaders(scores)
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className={cn('game-pop flex flex-col items-center gap-2 rounded-3xl p-6 text-center', tintClass(TEAM_TINTS[top[0]]))}>
        <Crown className="size-14" aria-hidden="true" />
        <span className="text-sm">{top.length > 1 ? t('games.taboo.tie') : t('games.taboo.winner')}</span>
        <span className="text-4xl font-medium" role="status">
          {top.map(team).join(' · ')}
        </span>
      </div>
      {scoreboard}
      <Button size="lg" onClick={newGame}>
        <RotateCcw data-icon="inline-start" />
        {t('games.playAgain')}
      </Button>
      <Button variant="outline" onClick={() => setStage('setup')}>
        <Settings2 data-icon="inline-start" />
        {t('games.changeSettings')}
      </Button>
    </div>
  )
}

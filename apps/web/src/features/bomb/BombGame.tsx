import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { Bomb, Play, RefreshCw, RotateCcw, Settings2 } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { BottomAction } from '@/components/games/BottomAction'
import { GameCard } from '@/components/games/GameCard'
import { PackPicker } from '@/components/games/PackPicker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { BOMB_LETTERS, BOMB_PACKS, NO_LETTER_PACKS, type BombPackId } from '@/config/games/bomb'
import { markDone } from '@/features/daily/daily'
import { celebrate } from '@/lib/celebrate'
import { gameDeck } from '@/lib/deck'
import { useGameSettings } from '@/lib/gameSettings'
import { pickOne } from '@/lib/random'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { pickFuse, tickGap, tickTimes, type FuseLength } from './logic'
import '@/components/games/games.css'

type Settings = { packs: string[]; fuse: FuseLength; letters: boolean }
const DEFAULTS: Settings = { packs: BOMB_PACKS.map((p) => p.id), fuse: 'normal', letters: false }
const fix = (raw: Partial<Settings>): Settings => {
  const packs = (raw.packs ?? []).filter((id) => BOMB_PACKS.some((p) => p.id === id))
  return { packs: packs.length ? packs : DEFAULTS.packs, fuse: raw.fuse === 'short' || raw.fuse === 'long' ? raw.fuse : 'normal', letters: raw.letters === true }
}

type Topic = { pack: BombPackId; text: string; letter: string | null }
const deck = gameDeck('bomb')

// ระเบิดเวลา: a topic, a hidden fuse, ticking that speeds up. Say one answer and pass; whoever holds it at the bang loses.
export function BombGame() {
  const { t } = useTranslation()
  const sound = useGameSound('bomb')
  const [settings, setSettings] = useGameSettings<Settings>('bomb', DEFAULTS, fix)
  const [stage, setStage] = useState<'setup' | 'play' | 'boom'>('setup')
  const [topics, setTopics] = useState<Topic[]>([])
  const [index, setIndex] = useState(0)
  const [gap, setGap] = useState(900)
  const [passes, setPasses] = useState(0)
  const timers = useRef<number[]>([])

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clear, [])

  function makeTopics(): Topic[] {
    const all = BOMB_PACKS.filter((p) => settings.packs.includes(p.id)).flatMap((p) => p.topics.map((text) => ({ pack: p.id, text })))
    return deck.order(all, (x) => x.text).map((x) => ({ ...x, letter: settings.letters && !NO_LETTER_PACKS.includes(x.pack) ? pickOne(BOMB_LETTERS) : null }))
  }

  function light(list = topics, at = index) {
    clear()
    unlockSound()
    const fuseMs = pickFuse(settings.fuse) * 1000
    setGap(900)
    setPasses(0)
    setStage('play')
    deck.markSeen([list[at].text])
    for (const ms of tickTimes(fuseMs)) {
      timers.current.push(
        window.setTimeout(() => {
          setGap(tickGap(ms, fuseMs))
          if (sound) playSound('tick', 1.6)
        }, ms),
      )
    }
    timers.current.push(window.setTimeout(explode, fuseMs))
  }

  function start() {
    const list = makeTopics()
    setTopics(list)
    setIndex(0)
    light(list, 0)
    markDone('tool')
  }

  function explode() {
    clear()
    setStage('boom')
    if (sound) playSound('boom')
    buzz([200, 80, 300])
    celebrate()
  }

  function nextTopic(relight: boolean) {
    const next = index + 1 < topics.length ? index + 1 : 0
    const list = next === 0 ? makeTopics() : topics
    if (next === 0) setTopics(list)
    setIndex(next)
    if (relight) light(list, next)
    else deck.markSeen([list[next].text])
    if (sound) playSound('flip', 0.7)
  }

  if (stage === 'setup') {
    return (
      <div className="flex flex-col gap-3 pb-28">
        <ol className="mx-3 grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          {(['topic', 'pass', 'boom'] as const).map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{i + 1}</span>
              <span>{t(`games.bomb.how.${step}`)}</span>
            </li>
          ))}
        </ol>
        <SectionHeader title={t('games.bomb.fuseTitle')} />
        <div className="px-3">
          <SegmentedChoice<FuseLength>
            label={t('games.bomb.fuseTitle')}
            value={settings.fuse}
            onChange={(fuse) => setSettings((s) => ({ ...s, fuse }))}
            options={(['short', 'normal', 'long'] as const).map((f) => ({ value: f, label: t(`games.bomb.fuse.${f}`) }))}
          />
        </div>
        <Card className="mx-3 px-4 py-1">
          <label className="flex min-h-14 items-center gap-3 py-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t('games.bomb.letters')}</span>
              <span className="block text-xs text-muted-foreground">{t('games.bomb.lettersHint')}</span>
            </span>
            <Switch checked={settings.letters} onCheckedChange={(letters) => setSettings((s) => ({ ...s, letters }))} aria-label={t('games.bomb.letters')} />
          </label>
        </Card>
        <SectionHeader title={t('games.party.packsTitle')} />
        <PackPicker
          multiple
          label={t('games.party.packsTitle')}
          value={settings.packs}
          onChange={(packs) => setSettings((s) => fix({ ...s, packs }))}
          packs={BOMB_PACKS.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`games.bomb.packs.${p.id}`), meta: t('games.bomb.topicsCount', { count: p.topics.length }) }))}
        />
        <BottomAction>
          <Button size="lg" className="flex-1" onClick={start}>
            <Play data-icon="inline-start" />
            {t('games.bomb.light')}
          </Button>
        </BottomAction>
      </div>
    )
  }

  const topic = topics[index]
  const pack = BOMB_PACKS.find((p) => p.id === topic.pack) ?? BOMB_PACKS[0]
  const topicText = topic.letter ? t('games.bomb.withLetter', { topic: topic.text, letter: topic.letter }) : topic.text

  if (stage === 'boom') {
    return (
      <div className="game-shake relative flex flex-col items-center gap-4 overflow-hidden px-4 pt-6 pb-8 text-center">
        <span className={cn('bomb-burst pointer-events-none absolute top-24 left-1/2 -ml-32 size-64 rounded-full', tintClass(1))} aria-hidden="true" />
        <span className={cn('game-pop relative grid size-40 place-items-center rounded-full', tintClass(1))}>
          <Bomb className="size-20" aria-hidden="true" />
        </span>
        <p className="game-pop relative text-6xl font-medium" role="alert">
          {t('games.bomb.boom')}
        </p>
        <p className="relative text-lg">{t('games.bomb.loser')}</p>
        <p className="relative text-sm text-muted-foreground">{t('games.bomb.topicWas', { topic: topicText })}</p>
        <div className="relative mt-2 grid w-full gap-2">
          <Button size="lg" onClick={() => nextTopic(true)}>
            <RotateCcw data-icon="inline-start" />
            {t('games.bomb.again')}
          </Button>
          <Button variant="outline" onClick={() => setStage('setup')}>
            <Settings2 data-icon="inline-start" />
            {t('games.changeSettings')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-3 pb-8">
      <span
        className={cn('bomb-throb grid size-28 place-items-center rounded-full', gap < 300 ? tintClass(1) : tintClass(3))}
        style={{ '--tick': `${gap}ms` } as CSSProperties}
        aria-hidden="true"
      >
        <Bomb className="size-14" />
      </span>
      <GameCard cardKey={`${index}-${topic.text}`} tint={pack.tint} eyebrow={t('games.bomb.sayOne')} text={topic.text} className="h-[min(40dvh,22rem)] min-h-56">
        {topic.letter && (
          <span className="flex items-center gap-2 rounded-2xl bg-background/70 px-4 py-1.5 text-lg">
            {t('games.bomb.startsWith')}
            <b className="text-4xl font-medium">{topic.letter}</b>
          </span>
        )}
      </GameCard>
      <Button
        size="lg"
        className="h-16 w-full text-lg"
        onClick={() => {
          setPasses((n) => n + 1)
          if (sound) playSound('pop')
          buzz(20)
        }}
      >
        {t('games.bomb.pass')}
        {passes > 0 && <span className="ml-2 rounded-full bg-background/30 px-2 text-sm tabular-nums">{passes}</span>}
      </Button>
      <Button variant="ghost" onClick={() => nextTopic(false)}>
        <RefreshCw data-icon="inline-start" />
        {t('games.bomb.newTopic')}
      </Button>
    </div>
  )
}

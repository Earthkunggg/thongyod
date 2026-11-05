import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Brush, Check, Eraser, Eye, Play, RotateCcw, Settings2, SkipForward, Trash2, Undo2 } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { BottomAction } from '@/components/games/BottomAction'
import { DrawCanvas, type DrawCanvasHandle } from '@/components/games/DrawCanvas'
import { FlipCard } from '@/components/games/FlipCard'
import { PackPicker } from '@/components/games/PackPicker'
import { PassPhone } from '@/components/games/PassPhone'
import { TimerBar } from '@/components/games/TimerBar'
import { Button } from '@/components/ui/button'
import { WORD_PACKS } from '@/config/wordPacks'
import { markDone } from '@/features/daily/daily'
import { celebrate } from '@/lib/celebrate'
import { gameDeck } from '@/lib/deck'
import { useGameSettings } from '@/lib/gameSettings'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { TONE_CLASS, tintClass } from '@/lib/tones'
import { useCountdown } from '@/lib/useCountdown'
import { cn } from '@/lib/utils'
import '@/components/games/games.css'

const SECONDS = [60, 90, 120] as const
type Settings = { packs: string[]; seconds: number }
const DEFAULTS: Settings = { packs: ['food', 'animals', 'things', 'actions', 'places', 'sports'], seconds: 90 }
const fix = (raw: Partial<Settings>): Settings => {
  const packs = (raw.packs ?? []).filter((id) => WORD_PACKS.some((p) => p.id === id))
  return { packs: packs.length ? packs : DEFAULTS.packs, seconds: SECONDS.includes(raw.seconds as 60) ? (raw.seconds as number) : 90 }
}

/** Pen colors come from the theme (CSS variables), so they suit light, dark and cute. */
const PEN_VARS = ['--foreground', '--tint-1-foreground', '--tint-3-foreground', '--tint-2-foreground', '--tint-5-foreground', '--tint-4-foreground']
const SIZES = [4, 9, 18]
const deck = gameDeck('draw')

type Result = { word: string; ok: boolean }
type Stage = 'setup' | 'pass' | 'peek' | 'draw' | 'summary'

// วาดแล้วทาย on one phone: the drawer peeks at the word, draws, friends shout guesses. As many words as the timer allows.
export function DrawGame() {
  const { t } = useTranslation()
  const sound = useGameSound('draw')
  const [settings, setSettings] = useGameSettings<Settings>('draw', DEFAULTS, fix)
  const [stage, setStage] = useState<Stage>('setup')
  const [turn, setTurn] = useState(0)
  const [results, setResults] = useState<Result[]>([])
  const [history, setHistory] = useState<number[]>([])
  const [word, setWord] = useState('')
  const [peeking, setPeeking] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [pens, setPens] = useState<string[]>([])
  const [pen, setPen] = useState(0)
  const [size, setSize] = useState(1)
  const [erase, setErase] = useState(false)
  const [newWord, setNewWord] = useState(false)
  const words = useRef<string[]>([])
  const pos = useRef(0)
  const canvas = useRef<DrawCanvasHandle>(null)
  const timer = useCountdown(settings.seconds, stage === 'draw', () => {
    if (sound) playSound('end')
    buzz([100, 60, 100])
    setStage('summary')
  })

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement)
      setPens(PEN_VARS.map((v) => style.getPropertyValue(v).trim() || 'black'))
    }
    read()
    // Theme or dark mode can change while playing.
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'data-mode', 'style'] })
    return () => observer.disconnect()
  }, [])

  function nextWord() {
    if (pos.current >= words.current.length) {
      words.current = deck.order(words.current, (w) => w)
      pos.current = 0
    }
    const w = words.current[pos.current++]
    deck.markSeen([w])
    setWord(w)
  }

  function start() {
    unlockSound()
    words.current = deck.order(
      WORD_PACKS.filter((p) => settings.packs.includes(p.id)).flatMap((p) => p.words),
      (w) => w,
    )
    pos.current = 0
    setTurn(0)
    setHistory([])
    setStage('pass')
    markDone('tool')
  }

  function beginTurn() {
    setResults([])
    nextWord()
    setFlipped(false)
    setStage('peek')
  }

  function startDrawing() {
    timer.reset(settings.seconds)
    setStage('draw')
    if (sound) playSound('go')
  }

  function mark(ok: boolean) {
    setResults((r) => [...r, { word, ok }])
    if (sound) playSound(ok ? 'correct' : 'pass')
    buzz(ok ? 30 : 15)
    if (ok) celebrate()
    canvas.current?.clear()
    nextWord()
    setNewWord(true)
    window.setTimeout(() => setNewWord(false), 1600)
  }

  function endTurn() {
    setHistory((h) => [...h, results.filter((r) => r.ok).length])
    setTurn((n) => n + 1)
    setStage('pass')
  }

  if (stage === 'setup') {
    return (
      <div className="flex flex-col gap-3 pb-28">
        <ol className="mx-3 grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          {(['peek', 'draw', 'guess'] as const).map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{i + 1}</span>
              <span>{t(`games.draw.how.${step}`)}</span>
            </li>
          ))}
        </ol>
        <SectionHeader title={t('games.draw.timeTitle')} />
        <div className="px-3">
          <SegmentedChoice<string>
            label={t('games.draw.timeTitle')}
            value={`${settings.seconds}`}
            onChange={(v) => setSettings((s) => fix({ ...s, seconds: Number(v) }))}
            options={SECONDS.map((n) => ({ value: `${n}`, label: t('headsUp.seconds', { count: n }) }))}
          />
        </div>
        <SectionHeader title={t('games.party.packsTitle')} />
        <PackPicker
          multiple
          label={t('games.party.packsTitle')}
          value={settings.packs}
          onChange={(packs) => setSettings((s) => fix({ ...s, packs }))}
          packs={WORD_PACKS.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`headsUp.packs.${p.id}.name`), meta: t('headsUp.wordsCount', { count: p.words.length }) }))}
        />
        <BottomAction>
          <Button size="lg" className="flex-1" onClick={start}>
            <Play data-icon="inline-start" />
            {t('games.start')}
          </Button>
        </BottomAction>
      </div>
    )
  }

  if (stage === 'pass') {
    return (
      <PassPhone key={turn} title={t('games.draw.passTo', { n: turn + 1 })} hint={t('games.draw.passHint')} action={t('games.draw.imDrawer')} onContinue={beginTurn}>
        {history.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-xs text-muted-foreground">
            {history.map((n, i) => (
              <span key={i} className="rounded-full bg-muted px-2.5 py-1">
                {t('games.draw.turnScore', { n: i + 1, count: n })}
              </span>
            ))}
          </div>
        )}
        <Button variant="ghost" className="mt-2" onClick={() => setStage('setup')}>
          <Settings2 data-icon="inline-start" />
          {t('games.changeSettings')}
        </Button>
      </PassPhone>
    )
  }

  if (stage === 'peek') {
    return (
      <div className="flex flex-col gap-4 px-4 pb-8">
        <FlipCard
          flipped={flipped}
          className="h-[min(52dvh,28rem)] w-full"
          front={
            <button
              type="button"
              onClick={() => {
                setFlipped(true)
                if (sound) playSound('flip')
              }}
              className={cn('flex size-full flex-col items-center justify-center gap-4 rounded-3xl p-6 text-center', tintClass(2))}
            >
              <Brush className="game-breathe size-20" aria-hidden="true" />
              <span className="text-2xl font-medium">{t('games.draw.tapToSee')}</span>
              <span className="text-sm opacity-80">{t('games.spy.hideScreen')}</span>
            </button>
          }
          back={
            <div className={cn('flex size-full flex-col items-center justify-center gap-3 rounded-3xl p-6 text-center', tintClass(5))}>
              <span className="text-sm opacity-80">{t('games.draw.yourWord')}</span>
              <span className="text-5xl leading-tight font-medium">{word}</span>
              <span className="mt-2 text-xs opacity-80">{t('games.draw.noLetters')}</span>
            </div>
          }
        />
        <Button size="lg" disabled={!flipped} onClick={startDrawing}>
          <Brush data-icon="inline-start" />
          {t('games.draw.startDrawing', { seconds: settings.seconds })}
        </Button>
      </div>
    )
  }

  if (stage === 'draw') {
    const got = results.filter((r) => r.ok).length
    return (
      <div className="flex flex-col gap-2 px-3 pb-4">
        <div className="flex items-center gap-2">
          <TimerBar left={timer.left} total={settings.seconds} className="flex-1" />
          <span className={cn('rounded-full px-2.5 py-1 text-sm font-medium tabular-nums', TONE_CLASS.success)}>✓ {got}</span>
        </div>
        <div className="relative">
          <DrawCanvas
            ref={canvas}
            color={pens[pen] ?? 'black'}
            size={SIZES[size]}
            erase={erase}
            label={t('games.draw.canvas')}
            className="h-[min(54dvh,32rem)] w-full border"
          />
          <div className="absolute right-2 bottom-2 flex flex-col gap-1 rounded-2xl bg-background/85 p-1 shadow-sm backdrop-blur">
            <Button variant={erase ? 'secondary' : 'ghost'} size="icon" aria-pressed={erase} aria-label={t('games.draw.eraser')} onClick={() => setErase((e) => !e)}>
              <Eraser />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t('games.draw.undo')} onClick={() => canvas.current?.undo()}>
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" aria-label={t('games.draw.clear')} onClick={() => canvas.current?.clear()}>
              <Trash2 />
            </Button>
          </div>
          {(peeking || newWord) && (
            <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
              <span className={cn('game-pop rounded-2xl px-4 py-2 text-xl font-medium shadow', newWord && !peeking ? TONE_CLASS.success : tintClass(5))}>
                {peeking ? word : t('games.draw.newWord')}
              </span>
            </div>
          )}
        </div>
        {/* Tools */}
        <div className="flex items-center justify-between gap-1 py-1" role="toolbar" aria-label={t('games.draw.tools')}>
          {pens.map((c, i) => (
            <button
              key={i}
              type="button"
              aria-label={t('games.draw.color', { n: i + 1 })}
              aria-pressed={!erase && pen === i}
              onClick={() => {
                setPen(i)
                setErase(false)
              }}
              className={cn('size-8 shrink-0 rounded-full border-2 transition-transform', !erase && pen === i ? 'scale-115 border-primary' : 'border-background')}
              style={{ backgroundColor: c }}
            />
          ))}
          <span className="h-7 w-px shrink-0 bg-border" aria-hidden="true" />
          {SIZES.map((s, i) => (
            <button
              key={s}
              type="button"
              aria-label={t('games.draw.size', { n: i + 1 })}
              aria-pressed={size === i}
              onClick={() => setSize(i)}
              className={cn('grid size-8 shrink-0 place-items-center rounded-full', size === i ? 'bg-muted' : '')}
            >
              <span className="rounded-full bg-foreground" style={{ width: 4 + i * 5, height: 4 + i * 5 }} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
          <Button
            variant="outline"
            size="lg"
            className="h-14 touch-none select-none"
            onPointerDown={() => setPeeking(true)}
            onPointerUp={() => setPeeking(false)}
            onPointerLeave={() => setPeeking(false)}
            onPointerCancel={() => setPeeking(false)}
            onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && setPeeking(true)}
            onKeyUp={() => setPeeking(false)}
          >
            <Eye data-icon="inline-start" />
            {t('games.draw.peek')}
          </Button>
          <Button variant="outline" size="lg" className="h-14" onClick={() => mark(false)}>
            <SkipForward data-icon="inline-start" />
            {t('games.taboo.skip')}
          </Button>
          <Button size="lg" className={cn('h-14', TONE_CLASS.success)} onClick={() => mark(true)}>
            <Check data-icon="inline-start" />
            {t('games.draw.guessed')}
          </Button>
        </div>
      </div>
    )
  }

  const got = results.filter((r) => r.ok).length
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className={cn('game-pop flex flex-col items-center gap-1 rounded-3xl p-6 text-center', tintClass(2))}>
        <span className="text-sm">{t('games.draw.turnOver', { n: turn + 1 })}</span>
        <span className="text-6xl font-medium tabular-nums">{got}</span>
        <span className="text-sm">{t('games.draw.wordsGuessed')}</span>
      </div>
      <ul className="flex flex-wrap justify-center gap-1.5">
        {results.map((r, i) => (
          <li key={`${r.word}-${i}`} className={cn('rounded-full px-3 py-1 text-sm', r.ok ? TONE_CLASS.success : TONE_CLASS.neutral)}>
            {r.ok ? '✓' : '–'} {r.word}
          </li>
        ))}
        <li className="rounded-full border border-dashed px-3 py-1 text-sm text-muted-foreground">
          {t('games.draw.lastWord', { word })}
        </li>
      </ul>
      <Button size="lg" onClick={endTurn}>
        <RotateCcw data-icon="inline-start" />
        {t('games.draw.nextDrawer')}
      </Button>
    </div>
  )
}

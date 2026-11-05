import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Candy, Play, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markDone } from '@/features/daily/daily'
import { celebrate } from '@/lib/celebrate'
import { useGameSettings } from '@/lib/gameSettings'
import { secureRandomInt } from '@/lib/random'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { applySwap, cupCount, makeSwaps, stepMs, swapCount } from './logic'
import '@/components/games/games.css'

type Phase = 'ready' | 'show' | 'shuffle' | 'pick' | 'win' | 'lose'
type Saved = { best: number }

/** Width of one slot as a share of the table. */
const LIFT = -64

// ขนมอยู่ไหน: watch the candy go under a cup, follow the shuffle, tap the right cup. Each win = next level.
export function CupsGame() {
  const { t } = useTranslation()
  const sound = useGameSound('cups')
  const [saved, setSaved] = useGameSettings<Saved>('cups', { best: 0 })
  const [level, setLevel] = useState(1)
  const [phase, setPhase] = useState<Phase>('ready')
  const [cups, setCups] = useState(3)
  const [slots, setSlots] = useState<number[]>([0, 1, 2])
  const [candy, setCandy] = useState(1)
  const [arc, setArc] = useState<Record<number, number>>({})
  const [speed, setSpeed] = useState(stepMs(1))
  const [picked, setPicked] = useState<number | null>(null)
  const timers = useRef<number[]>([])
  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }
  useEffect(() => clear, [])
  const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  function play(lv = level) {
    clear()
    unlockSound()
    const n = cupCount(lv)
    const start = Array.from({ length: n }, (_, i) => i)
    const hidden = secureRandomInt(n)
    const swaps = makeSwaps(n, swapCount(lv))
    const ms = stepMs(lv)
    setCups(n)
    setSlots(start)
    setCandy(hidden)
    setPicked(null)
    setArc({})
    setSpeed(ms)
    setPhase('show')
    if (sound) playSound('pop')
    // Show the candy, put the cup down, then shuffle step by step.
    let at = 1300
    later(at, () => setPhase('shuffle'))
    at += 500
    let current = start
    swaps.forEach((swap, i) => {
      const before = current
      current = applySwap(current, swap)
      const after = current
      later(at, () => {
        // The two moving cups pass each other: one arcs forward, one back.
        setArc({ [before[swap[0]]]: 18, [before[swap[1]]]: -18 })
        setSlots(after)
        if (sound) playSound('tick', 0.8)
      })
      later(at + ms * 0.55, () => setArc({}))
      at += ms + (i % 3 === 2 ? 60 : 0)
    })
    later(at + 150, () => setPhase('pick'))
  }

  function pick(cupId: number) {
    if (phase !== 'pick') return
    setPicked(cupId)
    if (cupId === candy) {
      setPhase('win')
      if (sound) playSound('correct')
      buzz(40)
      celebrate()
      if (level > saved.best) setSaved({ best: level })
      markDone('tool')
    } else {
      setPhase('lose')
      if (sound) playSound('pass')
      buzz([60, 40, 60])
      markDone('tool')
    }
  }

  const lifted = (cupId: number) => phase === 'show' || ((phase === 'win' || phase === 'lose') && (cupId === picked || cupId === candy))
  const width = 100 / cups

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className="flex items-center justify-between">
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', tintClass(6))}>{t('games.cups.level', { n: level })}</span>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Trophy className="size-4" aria-hidden="true" />
          {t('games.cups.best', { n: saved.best })}
        </span>
      </div>

      <div className={cn('relative h-64 overflow-hidden rounded-3xl', tintClass(2))} role="group" aria-label={t('games.cups.table')}>
        <div className="absolute inset-x-3 bottom-10 h-3 rounded-full bg-foreground/10" aria-hidden="true" />
        {Array.from({ length: cups }, (_, cupId) => {
          const slot = slots.indexOf(cupId)
          const up = lifted(cupId)
          return (
            <div key={cupId} className="absolute bottom-12 transition-[left] ease-in-out" style={{ left: `${slot * width}%`, width: `${width}%`, transitionDuration: `${speed}ms` }}>
              {/* Candy sits on the table under its cup. */}
              {cupId === candy && (
                <span className="absolute bottom-0 left-1/2 grid -translate-x-1/2 place-items-center">
                  <Candy className={cn('size-10', (phase === 'win' || phase === 'show') && 'game-pop', 'text-tint-3-foreground')} aria-hidden="true" />
                </span>
              )}
              <button
                type="button"
                disabled={phase !== 'pick'}
                onClick={() => pick(cupId)}
                aria-label={t('games.cups.cup', { n: slot + 1 })}
                className="relative mx-auto block w-[86%] max-w-28 transition-transform ease-out disabled:cursor-default"
                style={{ transform: `translate(${(arc[cupId] ?? 0) * 0.4}px, ${up ? LIFT : (arc[cupId] ?? 0)}px)`, transitionDuration: up ? '380ms' : `${speed * 0.5}ms` }}
              >
                <svg viewBox="0 0 100 110" className={cn('w-full drop-shadow-sm', phase === 'pick' && 'active:scale-95')} aria-hidden="true">
                  <path d="M14 8 h72 l-10 96 a6 6 0 0 1 -6 5 h-40 a6 6 0 0 1 -6 -5 z" className="fill-tint-1-foreground" />
                  <path d="M10 4 h80 a4 4 0 0 1 0 8 h-80 a4 4 0 0 1 0 -8 z" className="fill-tint-1-foreground opacity-80" />
                  <path d="M22 30 h56" className="stroke-background opacity-40" strokeWidth="6" strokeLinecap="round" />
                  <path d="M25 50 h50" className="stroke-background opacity-25" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          )
        })}
      </div>

      <p className="min-h-14 text-center text-lg font-medium" role="status" aria-live="polite">
        {phase === 'ready' && t('games.cups.intro')}
        {phase === 'show' && t('games.cups.watch')}
        {phase === 'shuffle' && t('games.cups.follow')}
        {phase === 'pick' && <span className="game-pop inline-block">{t('games.cups.where')}</span>}
        {phase === 'win' && <span className="game-pop inline-block">{t('games.cups.win')}</span>}
        {phase === 'lose' && <span className="game-shake inline-block">{t('games.cups.lose')}</span>}
      </p>

      {phase === 'ready' && (
        <Button size="lg" className="h-14 text-lg" onClick={() => play(1)}>
          <Play data-icon="inline-start" />
          {t('games.start')}
        </Button>
      )}
      {phase === 'win' && (
        <Button
          size="lg"
          className="h-14 text-lg"
          onClick={() => {
            setLevel(level + 1)
            play(level + 1)
          }}
        >
          <Play data-icon="inline-start" />
          {t('games.cups.next', { n: level + 1 })}
        </Button>
      )}
      {phase === 'lose' && (
        <Button
          size="lg"
          className="h-14 text-lg"
          onClick={() => {
            setLevel(1)
            play(1)
          }}
        >
          <RotateCcw data-icon="inline-start" />
          {t('games.playAgain')}
        </Button>
      )}
    </div>
  )
}

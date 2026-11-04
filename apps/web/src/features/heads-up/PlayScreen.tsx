import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize, Pause, Smartphone } from 'lucide-react'
import { FitText } from '@/components/common/FitText'
import { useFullscreen } from '@/lib/fullscreen'
import { Button } from '@/components/ui/button'
import { buzz, playSound, type SoundName } from '@/lib/sound'
import { TONE_CLASS } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { createTiltDetector, secondsLeft, type Answer, type Verdict } from './logic'
import { useTiltStream, useWakeLock } from './useTilt'

type Props = {
  words: string[]
  seconds: number
  useTilt: boolean
  inverted: boolean
  sound: boolean
  onFinish: (answers: Answer[]) => void
}

type Phase = 'rotate' | 'countdown' | 'play' | 'paused'

const COUNTDOWN_FROM = 3
/** How long the green/orange flash stays before the next word. */
const FLASH_MS = 550
const LAST_SECONDS = 10

const portraitQuery = () => window.matchMedia('(orientation: portrait)')

// Full-screen round: (rotate) → 3-2-1 → words. Tilt (if on) or tap left = pass / right = correct.
// Pause button in the corner. Calls onFinish with every answered word when time runs out or the player ends it.
export function PlayScreen({ words, seconds, useTilt, inverted, sound, onFinish }: Props) {
  const { t } = useTranslation()
  const [phase, setPhase] = useState<Phase>(() => (portraitQuery().matches ? 'rotate' : 'countdown'))
  const [count, setCount] = useState(COUNTDOWN_FROM)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [flash, setFlash] = useState<Verdict | null>(null)
  const [left, setLeft] = useState(seconds)
  const timing = useRef({ startedAt: 0, pausedMs: 0, pausedAt: 0 })
  const detector = useRef(createTiltDetector({ inverted }))
  const finished = useRef(false)

  const sfx = useCallback((name: SoundName) => sound && playSound(name), [sound])
  const fullscreen = useFullscreen()
  const wasFull = useRef(fullscreen.active)
  // Leaving fullscreen with the browser's ✕ (iPad) pauses the round, so no time is lost; a button brings it back.
  useEffect(() => {
    if (wasFull.current && !fullscreen.active && phase === 'play') pause()
    wasFull.current = fullscreen.active
  })
  useWakeLock(phase !== 'paused')

  // Rotate → countdown as soon as the phone is sideways.
  useEffect(() => {
    if (phase !== 'rotate') return
    const query = portraitQuery()
    const onChange = () => !query.matches && setPhase('countdown')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [phase])

  // 3-2-1 with a beep each second, then play.
  useEffect(() => {
    if (phase !== 'countdown') return
    sfx(count > 0 ? 'countdown' : 'go')
    const id = window.setTimeout(
      () => {
        if (count > 0) return setCount((c) => c - 1)
        timing.current = { startedAt: performance.now(), pausedMs: 0, pausedAt: 0 }
        setPhase('play')
      },
      count > 0 ? 1000 : 400,
    )
    return () => window.clearTimeout(id)
  }, [phase, count, sfx])

  const finish = useCallback(
    (list: Answer[]) => {
      if (finished.current) return
      finished.current = true
      sfx('end')
      buzz([40, 60, 40])
      onFinish(list)
    },
    [onFinish, sfx],
  )

  // Clock: recompute from timestamps (survives slow frames), tick in the last 10 seconds.
  useEffect(() => {
    if (phase !== 'play') return
    const id = window.setInterval(() => {
      const { startedAt, pausedMs } = timing.current
      const next = secondsLeft(startedAt, seconds, performance.now(), pausedMs)
      setLeft((prev) => {
        if (next !== prev && next > 0 && next <= LAST_SECONDS) sfx('tick')
        return next
      })
    }, 200)
    return () => window.clearInterval(id)
  }, [phase, seconds, sfx])

  useEffect(() => {
    if (phase === 'play' && left === 0) finish(answers)
  }, [phase, left, answers, finish])

  const answer = useCallback(
    (verdict: Verdict) => {
      if (phase !== 'play' || flash || finished.current) return
      setAnswers((list) => [...list, { word: words[index % words.length], verdict }])
      setFlash(verdict)
      sfx(verdict === 'correct' ? 'correct' : 'pass')
      buzz(verdict === 'correct' ? [15, 30, 15] : 15)
      window.setTimeout(() => {
        setFlash(null)
        setIndex((i) => i + 1)
      }, FLASH_MS)
    },
    [phase, flash, words, index, sfx],
  )

  // Sensor: calibrate during the countdown, answer during play. Watchdog → taps only.
  const stuck = useTiltStream(useTilt && (phase === 'countdown' || phase === 'play'), (z, time) => {
    if (phase === 'countdown') detector.current.calibrate(z)
    else if (phase === 'play') {
      const verdict = detector.current.feed(z, time)
      if (verdict) answer(verdict)
    }
  })
  // Keyboard for desktop testing and accessibility: ← pass, → correct, Space/Esc pause.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') answer('pass')
      else if (e.key === 'ArrowRight') answer('correct')
      else if ((e.key === 'Escape' || e.key === ' ') && phase === 'play') pause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function pause() {
    timing.current.pausedAt = performance.now()
    setPhase('paused')
  }
  function resume() {
    timing.current.pausedMs += performance.now() - timing.current.pausedAt
    setPhase('play')
  }

  const score = answers.filter((a) => a.verdict === 'correct').length
  const word = words[index % words.length]

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground select-none" role="application" aria-label={t('headsUp.title')}>
      {phase === 'rotate' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <Smartphone className="size-16 motion-safe:animate-[spin_2.4s_ease-in-out_infinite] text-primary" aria-hidden="true" />
          <p className="text-2xl font-medium">{t('headsUp.rotate')}</p>
          <p className="text-sm text-muted-foreground">{t('headsUp.rotateHint')}</p>
          <Button variant="outline" onClick={() => setPhase('countdown')}>
            {t('headsUp.playPortrait')}
          </Button>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2" aria-live="assertive">
          <span key={count} className="font-heading text-[clamp(5rem,30vmin,12rem)] leading-none font-medium text-primary motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:fade-in-0 motion-safe:duration-300">
            {count > 0 ? count : '!'}
          </span>
          <span className="text-lg text-muted-foreground">{t('headsUp.getReady')}</span>
        </div>
      )}

      {(phase === 'play' || phase === 'paused') && (
        <>
          <div className="relative z-10 flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
            <span className="flex items-center">
              <Button variant="ghost" size="icon" aria-label={t('headsUp.pause')} onClick={pause}>
                <Pause />
              </Button>
              {fullscreen.supported && !fullscreen.active && (
                <Button variant="ghost" size="icon" aria-label={t('headsUp.fullscreen')} onClick={() => void fullscreen.enter()}>
                  <Maximize />
                </Button>
              )}
            </span>
            <span
              className={cn('rounded-full px-3 py-1 text-lg font-medium tabular-nums', left <= LAST_SECONDS ? TONE_CLASS.warning : 'bg-muted')}
              aria-label={t('headsUp.timeLeft', { count: left })}
            >
              {left}
            </span>
            <span className="min-w-11 text-right text-lg font-medium tabular-nums" aria-label={`${t('headsUp.scoreLabel')} ${score}`}>
              ✓ {score}
            </span>
          </div>

          {/* Tap zones: left half = pass, right half = correct (always on, UX §4). */}
          <div className="absolute inset-0 grid grid-cols-2">
            <button type="button" aria-label={t('headsUp.tapPass')} onClick={() => answer('pass')} className="flex items-end justify-start p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-xs text-muted-foreground">
              ◀ {t('headsUp.tapPass')}
            </button>
            <button type="button" aria-label={t('headsUp.tapCorrect')} onClick={() => answer('correct')} className="flex items-end justify-end p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] text-xs text-muted-foreground">
              {t('headsUp.tapCorrect')} ▶
            </button>
          </div>

          <div className="pointer-events-none relative flex min-h-0 flex-1 items-center justify-center px-[4vw] py-2" aria-live="polite">
            <div key={index} className="size-full font-heading font-medium motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-90 motion-safe:duration-200">
              <FitText text={word} max={260} min={28} maxLines={2} />
            </div>
          </div>

          {stuck && useTilt && <p className="pointer-events-none relative pb-10 text-center text-xs text-muted-foreground">{t('headsUp.sensorStuck')}</p>}

          {flash && (
            <div
              className={cn(
                'pointer-events-none absolute inset-0 z-20 flex items-center justify-center motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150',
                flash === 'correct' ? TONE_CLASS.success : TONE_CLASS.warning,
              )}
              aria-live="assertive"
            >
              <span className="font-heading text-[clamp(3rem,18vmin,8rem)] font-medium">{flash === 'correct' ? t('headsUp.correct') : t('headsUp.pass')}</span>
            </div>
          )}

          {phase === 'paused' && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/95 p-6">
              <p className="text-2xl font-medium">{t('headsUp.paused')}</p>
              <p className="text-sm text-muted-foreground">{t('headsUp.timeLeft', { count: left })}</p>
              <Button size="lg" className="w-56" onClick={resume}>
                {t('headsUp.resume')}
              </Button>
              {fullscreen.supported && !fullscreen.active && (
                <Button
                  variant="outline"
                  className="w-56"
                  onClick={() => {
                    void fullscreen.enter()
                    resume()
                  }}
                >
                  <Maximize data-icon="inline-start" />
                  {t('headsUp.resumeFullscreen')}
                </Button>
              )}
              <Button variant="outline" className="w-56" onClick={() => finish(answers)}>
                {t('headsUp.quit')}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dices, Smartphone, Wine } from 'lucide-react'
import { NumberStepper } from '@/components/common/NumberStepper'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { Button } from '@/components/ui/button'
import { useShake } from '@/features/fortune/useShake'
import { markDone } from '@/features/daily/daily'
import { useGameSettings } from '@/lib/gameSettings'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { Die } from './Die'
import { rollDice, spinBottle, total, tumble, type Face } from './logic'
import '@/components/games/games.css'

type Mode = 'dice' | 'bottle'
type Settings = { mode: Mode; dice: number; seats: number }
const DEFAULTS: Settings = { mode: 'dice', dice: 2, seats: 6 }
const fix = (raw: Partial<Settings>): Settings => ({
  mode: raw.mode === 'bottle' ? 'bottle' : 'dice',
  dice: Math.max(1, Math.min(3, Math.round(raw.dice ?? 2))),
  seats: raw.seats === 0 ? 0 : Math.max(2, Math.min(12, Math.round(raw.seats ?? 6))),
})

const ROLL_MS = 1100
const SPIN_MS = 3200
const DIE_TINTS = [5, 3, 2]
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ลูกเต๋า & ปั่นขวด: shake or tap. Results are decided first, then the 3D dice / bottle animate to them.
export function DiceBottleGame() {
  const { t } = useTranslation()
  const sound = useGameSound('dice')
  const [settings, setSettings] = useGameSettings<Settings>('dice', DEFAULTS, fix)
  const [faces, setFaces] = useState<Face[]>(() => Array.from({ length: settings.dice }, () => 1 as Face))
  const [rots, setRots] = useState(() => Array.from({ length: 3 }, () => ({ x: -20, y: 25 })))
  const [rollKey, setRollKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [shown, setShown] = useState(false)
  const [bottle, setBottle] = useState(0)
  const [seat, setSeat] = useState<number | null>(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const set = (patch: Partial<Settings>) => setSettings((s) => fix({ ...s, ...patch }))

  function roll() {
    if (busy) return
    unlockSound()
    const next = rollDice(settings.dice)
    setFaces(next)
    setRots((r) => r.map((rot, i) => (i < next.length ? tumble(rot, next[i], 2 + i) : rot)))
    setRollKey((k) => k + 1)
    setShown(false)
    setBusy(true)
    if (sound) playSound('roll')
    buzz(40)
    const wait = reducedMotion() ? 0 : ROLL_MS
    timer.current = window.setTimeout(() => {
      setBusy(false)
      setShown(true)
      if (sound) playSound('pop')
      markDone('tool')
    }, wait)
  }

  function spin() {
    if (busy) return
    unlockSound()
    const next = spinBottle(bottle, settings.seats)
    setBottle(next.rotation)
    setSeat(null)
    setShown(false)
    setBusy(true)
    if (sound) playSound('pass', 0.6)
    const wait = reducedMotion() ? 0 : SPIN_MS
    timer.current = window.setTimeout(() => {
      setBusy(false)
      setSeat(next.seat)
      setShown(true)
      if (sound) playSound('end')
      buzz(50)
      markDone('tool')
    }, wait)
  }

  const go = settings.mode === 'dice' ? roll : spin
  const shake = useShake(go, true)

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <SegmentedChoice<Mode>
        label={t('games.dice.modeLabel')}
        value={settings.mode}
        onChange={(mode) => {
          set({ mode })
          setShown(false)
        }}
        options={[
          { value: 'dice', label: t('games.dice.dice'), icon: Dices },
          { value: 'bottle', label: t('games.dice.bottle'), icon: Wine },
        ]}
      />

      {settings.mode === 'dice' ? (
        <>
          <button
            type="button"
            onClick={roll}
            aria-label={t('games.dice.roll')}
            className={cn('relative flex min-h-[42dvh] flex-col items-center justify-center gap-6 rounded-3xl p-6', tintClass(4))}
          >
            <div className="flex flex-wrap items-center justify-center gap-6">
              {faces.map((_, i) => (
                <Die key={i} rollKey={rollKey} rotation={rots[i]} faceClass={cn('bg-card', i === 0 ? 'text-foreground' : tintClass(DIE_TINTS[i]).split(' ')[1])} />
              ))}
            </div>
            <span className="min-h-12 text-center" role="status" aria-live="polite">
              {shown && (
                <span className="game-pop block">
                  <span className="block text-5xl font-medium tabular-nums">{faces.length > 1 ? total(faces) : faces[0]}</span>
                  {faces.length > 1 && <span className="text-sm opacity-80">{faces.join(' + ')}</span>}
                </span>
              )}
            </span>
          </button>
          <div className="flex items-center justify-between rounded-2xl border bg-card p-3">
            <span className="text-sm font-medium">{t('games.dice.howMany')}</span>
            <NumberStepper
              label={t('games.dice.howMany')}
              value={settings.dice}
              min={1}
              max={3}
              onChange={(dice) => {
                set({ dice })
                setFaces(Array.from({ length: dice }, (_, i) => faces[i] ?? (1 as Face)))
                setShown(false)
              }}
            />
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={spin}
            aria-label={t('games.dice.spin')}
            className={cn('relative mx-auto grid aspect-square w-full max-w-[22rem] place-items-center rounded-full', tintClass(2))}
          >
            {settings.seats >= 2 &&
              Array.from({ length: settings.seats }, (_, i) => {
                const a = ((i * 360) / settings.seats - 90) * (Math.PI / 180)
                return (
                  <span
                    key={i}
                    className={cn(
                      'absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-sm font-medium transition-transform',
                      seat === i ? 'game-pop scale-125 bg-primary text-primary-foreground' : 'bg-background/80',
                    )}
                    style={{ left: `${50 + 43 * Math.cos(a)}%`, top: `${50 + 43 * Math.sin(a)}%` }}
                  >
                    {i + 1}
                  </span>
                )
              })}
            <svg viewBox="0 0 60 200" className="bottle-spin h-[62%]" style={{ transform: `rotate(${bottle}deg)` }} aria-hidden="true">
              <rect x="22" y="4" width="16" height="10" rx="3" className="fill-current opacity-80" />
              <path d="M24 14 h12 v34 c0 10 18 18 18 40 v96 a12 12 0 0 1 -12 12 h-24 a12 12 0 0 1 -12 -12 v-96 c0 -22 18 -30 18 -40 z" className="fill-current opacity-90" />
              <rect x="14" y="110" width="32" height="44" rx="6" className="fill-background opacity-70" />
              <path d="M20 40 c0 8 -2 12 -6 18" className="stroke-background opacity-50" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </button>
          <p className="min-h-8 text-center text-xl font-medium" role="status" aria-live="polite">
            {shown && seat !== null && <span className="game-pop inline-block">{t('games.dice.pointsAt', { n: seat + 1 })}</span>}
          </p>
          <div className="flex items-center justify-between rounded-2xl border bg-card p-3">
            <span className="min-w-0 text-sm">
              <span className="block font-medium">{t('games.dice.seats')}</span>
              <span className="block text-xs text-muted-foreground">{t('games.dice.seatsHint')}</span>
            </span>
            <NumberStepper label={t('games.dice.seats')} value={settings.seats} min={0} max={12} onChange={(seats) => set({ seats: seats === 1 ? (settings.seats === 0 ? 2 : 0) : seats })} />
          </div>
        </>
      )}

      <Button size="lg" className="h-14 text-lg" disabled={busy} onClick={go}>
        {settings.mode === 'dice' ? <Dices data-icon="inline-start" /> : <Wine data-icon="inline-start" />}
        {settings.mode === 'dice' ? t('games.dice.roll') : t('games.dice.spin')}
      </Button>
      {shake.support === 'needs-permission' && (
        <Button variant="outline" onClick={() => void shake.requestPermission()}>
          <Smartphone data-icon="inline-start" />
          {t('games.dice.enableShake')}
        </Button>
      )}
      {shake.support === 'on' && <p className="text-center text-xs text-muted-foreground">{t('games.dice.shakeHint')}</p>}
    </div>
  )
}

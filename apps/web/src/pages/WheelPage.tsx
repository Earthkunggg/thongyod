import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { HandCoins, Plus, RotateCw, Utensils, Vote, X } from 'lucide-react'
import { SpinWheel } from '@/components/common/SpinWheel'
import { SuggestionChips } from '@/components/common/SuggestionChips'
import { GameHeaderActions } from '@/components/games/HowToPlay'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { celebrate } from '@/lib/celebrate'
import { markDone } from '@/features/daily/daily'
import { MAX_OPTION_LENGTH, MAX_OPTIONS, MIN_OPTIONS, canSpin, normalizeOptions, spin, tickTimes } from '@/features/wheel/logic'
import { playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { loadOptions, saveOptions } from '@/features/wheel/storage'

/** UX_GUIDELINES motion token `story`: ≤ 1200 ms, always skippable by tap. */
const SPIN_MS = 1200
const PRESETS = ['food', 'whoPays', 'yesNo'] as const
const PRESET_ICONS = [Utensils, HandCoins, Vote]
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Phase = 'idle' | 'spinning' | 'result'

// Wheel of names on one phone: type options (or pick a preset) → spin → result.
export function WheelPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  // /wheel?preset=food (from Home "กินอะไรดี") starts with that preset.
  const [options, setOptions] = useState<string[]>(() => {
    const preset = PRESETS.find((p) => p === params.get('preset'))
    if (preset) return normalizeOptions(splitList(t(`wheel.presets.${preset}.items`)))
    return loadOptions() ?? splitList(t('wheel.presets.food.items'))
  })
  const [draft, setDraft] = useState('')
  const [rotation, setRotation] = useState(0)
  const [duration, setDuration] = useState(SPIN_MS)
  const [phase, setPhase] = useState<Phase>('idle')
  const [winner, setWinner] = useState<number | null>(null)
  /** Id of the spin waiting for its result (0 = none). Makes sure each result shows exactly once. */
  const pending = useRef(0)
  const spinCount = useRef(0)
  const sound = useGameSound('wheel')
  /** Pending tick sounds of the current spin (cleared on skip / leave). */
  const ticks = useRef<number[]>([])
  const clearTicks = () => {
    ticks.current.forEach((id) => window.clearTimeout(id))
    ticks.current = []
  }
  useEffect(() => clearTicks, [])

  useEffect(() => saveOptions(options), [options])

  const ready = canSpin(options)
  const full = options.length >= MAX_OPTIONS

  function startSpin() {
    if (phase === 'spinning') {
      // Tap while spinning = skip to the result.
      setDuration(0)
      showResult()
      return
    }
    if (ready) spinWith(options.length)
  }

  /** Winner first (secure random), then animate to it. */
  function spinWith(count: number) {
    const next = spin(rotation, count)
    setWinner(next.index)
    setPhase('spinning')
    const instant = reducedMotion()
    setDuration(instant ? 0 : SPIN_MS)
    setRotation(next.rotation)
    clearTicks()
    if (sound && !instant) {
      unlockSound()
      // One soft tick each time the pointer passes a slice border, slowing down with the wheel.
      const borders = Math.round(Math.abs(next.rotation - rotation) / (360 / count))
      ticks.current = tickTimes(borders, SPIN_MS).map((ms) => window.setTimeout(() => playSound('tick', 0.8), ms))
    }
    const id = ++spinCount.current
    pending.current = id
    if (instant) showResult()
    // Safety net: the animation-end event can be skipped when the app goes to the background mid-spin.
    else window.setTimeout(() => pending.current === id && showResult(), SPIN_MS + 400)
  }

  function showResult() {
    if (!pending.current) return
    pending.current = 0
    clearTicks()
    if (sound) playSound('end')
    setPhase('result')
    markDone('tool')
    celebrate()
    navigator.vibrate?.(30)
  }

  function addOption(e: FormEvent) {
    e.preventDefault()
    const value = draft.trim().slice(0, MAX_OPTION_LENGTH)
    if (!value || full) return
    setOptions((o) => [...o, value])
    setDraft('')
  }

  function removeOption(index: number) {
    setOptions((o) => o.filter((_, i) => i !== index))
    setWinner(null)
  }

  function applyPreset(id: (typeof PRESETS)[number]) {
    setOptions(normalizeOptions(splitList(t(`wheel.presets.${id}.items`))))
    setWinner(null)
  }

  function removeWinnerAndSpin() {
    if (winner === null) return
    const rest = options.filter((_, i) => i !== winner)
    setOptions(rest)
    spinWith(rest.length)
  }

  const locked = phase === 'spinning'

  return (
    <>
      <PageHeader title={t('wheel.title')} subtitle={t('wheel.subtitle')} backTo="/games" action={<GameHeaderActions game="wheel" />} />

      <div className="flex flex-col gap-5 px-4 pb-8">
        <div className="mx-auto w-full max-w-[320px]">
          <SpinWheel
            options={options}
            rotation={rotation}
            durationMs={duration}
            onSpinEnd={showResult}
            onTap={startSpin}
            label={locked ? t('wheel.skip') : t('wheel.spin')}
          />
        </div>

        <Button size="lg" onClick={startSpin} disabled={!ready && !locked}>
          <RotateCw data-icon="inline-start" />
          {locked ? t('wheel.skip') : t('wheel.spin')}
        </Button>
        {!ready && <p className="-mt-3 text-center text-sm text-muted-foreground">{t('wheel.needOptions', { min: MIN_OPTIONS })}</p>}

        <section className="flex flex-col gap-3" aria-labelledby="wheel-options">
          <div className="flex items-baseline justify-between">
            <h2 id="wheel-options" className="text-sm font-medium">
              {t('wheel.options')}
            </h2>
            <span className="text-xs text-muted-foreground">
              {options.length}/{MAX_OPTIONS}
            </span>
          </div>

          <ul className="flex flex-wrap gap-2">
            {options.map((option, i) => (
              <li key={`${option}-${i}`} className="flex h-9 items-center gap-1 rounded-full border bg-card pr-1 pl-3 text-sm">
                <span className="max-w-[10rem] truncate">{option}</span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => removeOption(i)}
                  aria-label={t('wheel.remove', { name: option })}
                  className="grid size-7 place-items-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={addOption} className="flex gap-2">
            <Input
              value={draft}
              maxLength={MAX_OPTION_LENGTH}
              placeholder={full ? t('wheel.full', { max: MAX_OPTIONS }) : t('wheel.addPlaceholder')}
              aria-label={t('wheel.addPlaceholder')}
              disabled={full || locked}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" variant="outline" size="icon" disabled={full || locked || !draft.trim()} aria-label={t('wheel.add')}>
              <Plus />
            </Button>
          </form>

          <SuggestionChips
            label={t('wheel.presetsLabel')}
            items={PRESETS.map((id) => t(`wheel.presets.${id}.name`))}
            icons={PRESET_ICONS}
            onPick={(name) => {
              const id = PRESETS.find((p) => t(`wheel.presets.${p}.name`) === name)
              if (id && !locked) applyPreset(id)
            }}
          />
        </section>
      </div>

      <Dialog open={phase === 'result'} onOpenChange={(open) => !open && setPhase('idle')}>
        <DialogContent title={t('wheel.resultTitle')} className="items-center text-center">
          <p className="text-3xl font-medium break-words" role="status">
            {winner !== null ? options[winner] : ''}
          </p>
          <div className="grid w-full gap-2">
            <Button onClick={() => spinWith(options.length)}>
              {t('wheel.again')}
            </Button>
            {options.length > MIN_OPTIONS && (
              <Button variant="outline" onClick={removeWinnerAndSpin}>
                {t('wheel.removeWinner')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )

}

function splitList(text: string): string[] {
  return text.split(',').map((s) => s.trim())
}

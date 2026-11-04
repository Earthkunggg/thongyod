import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { HandCoins, Plus, RotateCw, Utensils, Vote, X } from 'lucide-react'
import { SpinWheel } from '@/components/common/SpinWheel'
import { SuggestionChips } from '@/components/common/SuggestionChips'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pet, type PetHandle } from '@/components/pet/Pet'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { celebrate } from '@/lib/celebrate'
import { getMyPet } from '@/features/onboarding/storage'
import { MAX_OPTION_LENGTH, MAX_OPTIONS, MIN_OPTIONS, canSpin, normalizeOptions, spin } from '@/features/wheel/logic'
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
  const [options, setOptions] = useState<string[]>(() => loadOptions() ?? splitList(t('wheel.presets.food.items')))
  const [draft, setDraft] = useState('')
  const [rotation, setRotation] = useState(0)
  const [duration, setDuration] = useState(SPIN_MS)
  const [phase, setPhase] = useState<Phase>('idle')
  const [winner, setWinner] = useState<number | null>(null)
  const pet = useRef<PetHandle>(null)
  /** Id of the spin waiting for its result (0 = none). Makes sure each result shows exactly once. */
  const pending = useRef(0)
  const spinCount = useRef(0)
  const [species] = useState(() => getMyPet()?.species ?? 'dragon')

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
    const id = ++spinCount.current
    pending.current = id
    if (instant) showResult()
    // Safety net: the animation-end event can be skipped when the app goes to the background mid-spin.
    else window.setTimeout(() => pending.current === id && showResult(), SPIN_MS + 400)
  }

  function showResult() {
    if (!pending.current) return
    pending.current = 0
    setPhase('result')
    celebrate()
    navigator.vibrate?.(30)
    window.setTimeout(() => pet.current?.run('tap'), 150)
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
      <PageHeader title={t('wheel.title')} subtitle={t('wheel.subtitle')} backTo="/explore" />

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
          <Pet ref={pet} species={species} size={120} />
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

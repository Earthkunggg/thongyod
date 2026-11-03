import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { NumberStepper } from '@/components/common/NumberStepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_OPTIONS, MAX_VOTERS, MIN_OPTIONS, MIN_VOTERS, normalizeSetup, type QuickVoteSetup } from './logic'

type SetupFormProps = {
  initial?: QuickVoteSetup
  onStart: (setup: QuickVoteSetup) => void
}

const EMPTY: QuickVoteSetup = { question: '', options: ['', ''], voterCount: 4, multiple: false }

// One screen to set up a quick vote. Only the options are required.
export function SetupForm({ initial = EMPTY, onStart }: SetupFormProps) {
  const { t } = useTranslation()
  const [setup, setSetup] = useState<QuickVoteSetup>(initial)
  const [showError, setShowError] = useState(false)
  const valid = normalizeSetup(setup) !== null

  function update(patch: Partial<QuickVoteSetup>) {
    setSetup((s) => ({ ...s, ...patch }))
    setShowError(false)
  }

  function setOption(i: number, value: string) {
    update({ options: setup.options.map((o, j) => (j === i ? value : o)) })
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const clean = normalizeSetup(setup)
    if (!clean) {
      setShowError(true)
      return
    }
    onStart(clean)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 px-4 pb-6" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('quickVote.question')}</span>
        <Input
          value={setup.question}
          maxLength={80}
          placeholder={t('quickVote.questionPlaceholder')}
          onChange={(e) => update({ question: e.target.value })}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium">{t('quickVote.options')}</legend>
        {setup.options.map((option, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={option}
              maxLength={40}
              placeholder={t('quickVote.optionPlaceholder', { n: i + 1 })}
              aria-label={t('quickVote.optionPlaceholder', { n: i + 1 })}
              aria-invalid={showError && option.trim() === '' ? true : undefined}
              onChange={(e) => setOption(i, e.target.value)}
            />
            {setup.options.length > MIN_OPTIONS && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('quickVote.removeOption', { n: i + 1 })}
                onClick={() => update({ options: setup.options.filter((_, j) => j !== i) })}
              >
                <X />
              </Button>
            )}
          </div>
        ))}
        {setup.options.length < MAX_OPTIONS && (
          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => update({ options: [...setup.options, ''] })}
          >
            <Plus data-icon="inline-start" />
            {t('quickVote.addOption')}
          </Button>
        )}
        {showError && (
          <p role="alert" className="text-sm text-destructive">
            {t('quickVote.needOptions')}
          </p>
        )}
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{t('quickVote.voters')}</span>
        <NumberStepper
          label={t('quickVote.voters')}
          value={setup.voterCount}
          min={MIN_VOTERS}
          max={MAX_VOTERS}
          onChange={(voterCount) => update({ voterCount })}
        />
      </div>

      <details className="rounded-xl border bg-card px-4 py-3 [&_summary]:cursor-pointer">
        <summary className="text-sm font-medium">{t('quickVote.advanced')}</summary>
        <label className="mt-3 flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-5 accent-primary"
            checked={setup.multiple}
            onChange={(e) => update({ multiple: e.target.checked })}
          />
          <span>
            <span className="block text-sm">{t('quickVote.multiple')}</span>
            <span className="block text-xs text-muted-foreground">{t('quickVote.multipleHint')}</span>
          </span>
        </label>
      </details>

      <Button type="submit" size="lg" aria-disabled={!valid}>
        {t('quickVote.start')}
      </Button>
    </form>
  )
}

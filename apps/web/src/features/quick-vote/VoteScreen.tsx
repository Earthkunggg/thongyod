import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { QuickVoteSession } from './logic'

type VoteScreenProps = {
  session: QuickVoteSession
  onVote: (choices: number[]) => void
}

// The current voter's turn. Single choice: one tap votes. Multiple: tick, then confirm.
export function VoteScreen({ session, onVote }: VoteScreenProps) {
  const { t } = useTranslation()
  const multiple = session.multiple && session.round === 1
  const [picked, setPicked] = useState<number[]>([])

  function tap(index: number) {
    if (!multiple) {
      onVote([index])
      return
    }
    setPicked((p) => (p.includes(index) ? p.filter((i) => i !== index) : [...p, index]))
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {session.round > 1 && `${t('quickVote.runoffRound', { round: session.round })} · `}
          {t('quickVote.voterProgress', { current: session.ballots.length + 1, total: session.voterCount })}
        </p>
        {session.question && <h2 className="mt-1 text-xl font-medium">{session.question}</h2>}
        <p className="mt-1 text-sm text-muted-foreground">
          {multiple ? t('quickVote.pickMany') : t('quickVote.pickOne')}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {session.candidates.map((index) => {
          const selected = picked.includes(index)
          return (
            <button
              key={index}
              type="button"
              aria-pressed={multiple ? selected : undefined}
              onClick={() => tap(index)}
              className={cn(
                'flex min-h-14 items-center justify-between gap-3 rounded-xl border bg-card px-4 text-left text-base font-medium',
                'transition-[transform,background-color] active:scale-[0.98]',
                selected && 'border-primary bg-accent text-accent-foreground',
              )}
            >
              <span className="min-w-0 break-words">{session.options[index]}</span>
              {multiple && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-md border',
                    selected && 'border-primary bg-primary text-primary-foreground',
                  )}
                >
                  {selected && <Check className="size-4" />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {multiple && (
        <Button size="lg" disabled={picked.length === 0} onClick={() => onVote(picked)}>
          {t('quickVote.confirm')}
        </Button>
      )}
    </div>
  )
}

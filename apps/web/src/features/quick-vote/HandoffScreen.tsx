import { useTranslation } from 'react-i18next'
import { CheckCircle2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { QuickVoteSession } from './logic'

type HandoffScreenProps = {
  session: QuickVoteSession
  onNext: () => void
  onUndo: () => void
  onCloseNow: () => void
}

// Covers the screen right after a vote so the next person cannot see it.
export function HandoffScreen({ session, onNext, onUndo, onCloseNow }: HandoffScreenProps) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[70dvh] flex-col px-4 pb-6">
      <button
        type="button"
        onClick={onNext}
        className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-accent p-6 text-center text-accent-foreground active:opacity-80"
      >
        <CheckCircle2 className="size-12" aria-hidden="true" />
        <span className="text-xl font-medium">{t('quickVote.handoffText')}</span>
        <span className="text-sm">
          {t('quickVote.handoffCount', { done: session.ballots.length, total: session.voterCount })}
        </span>
        <span className="mt-4 rounded-lg bg-primary px-5 py-3 text-base font-medium text-primary-foreground">
          {t('quickVote.nextVoter')}
        </span>
      </button>
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onUndo}>
          <Undo2 data-icon="inline-start" />
          {t('quickVote.undo')}
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCloseNow}>
          {t('quickVote.closeNow')}
        </Button>
      </div>
    </div>
  )
}

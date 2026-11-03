import { useTranslation } from 'react-i18next'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { rank, type QuickVoteSession } from './logic'

type ResultViewProps = {
  session: QuickVoteSession
  onNewVote: () => void
  onDone: () => void
}

// Ranked results as bars. Shows only totals, never who voted for what.
export function ResultView({ session, onNewVote, onDone }: ResultViewProps) {
  const { t } = useTranslation()
  const ranked = rank(session)
  const max = Math.max(1, ...ranked.map((r) => r.votes))
  const winner = session.winner

  return (
    <div className="flex flex-col gap-4 px-4 pb-6">
      {session.question && <h2 className="text-xl font-medium">{session.question}</h2>}

      {winner !== null && (
        <Card className="flex items-center gap-3 border-primary bg-accent p-4 text-accent-foreground">
          <Trophy className="size-8 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-xs">{t('quickVote.winner')}</p>
            <p className="text-xl font-medium break-words">{session.options[winner]}</p>
            {session.decidedBy === 'random' && <p className="text-xs">{t('quickVote.decidedRandom')}</p>}
            {session.decidedBy === 'manual' && <p className="text-xs">{t('quickVote.decidedManual')}</p>}
          </div>
        </Card>
      )}

      <ol className="flex flex-col gap-3" aria-label={t('quickVote.resultTitle')}>
        {ranked.map(({ index, votes }) => (
          <li key={index}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className={cn('min-w-0 break-words', index === winner && 'font-medium')}>
                {session.options[index]}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">{t('quickVote.votes', { count: votes })}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className={cn('h-full rounded-full transition-[width] duration-500', index === winner ? 'bg-primary' : 'bg-muted-foreground/40')}
                style={{ width: `${(votes / max) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>

      {session.phase === 'decided' && (
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={onNewVote}>
            {t('quickVote.newVote')}
          </Button>
          <Button size="lg" className="flex-1" onClick={onDone}>
            {t('quickVote.done')}
          </Button>
        </div>
      )}
    </div>
  )
}

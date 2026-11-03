import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { leaders, type QuickVoteSession } from './logic'

const SHUFFLE_MS = 1200
const STEP_MS = 100

type TieDialogProps = {
  session: QuickVoteSession
  onRandom: () => void
  onRunoff: () => void
  onManual: (index: number) => void
}

// Shown when the top options have the same votes.
// Random is recommended (fastest). After a tie-break round, runoff is no longer offered.
export function TieDialog({ session, onRandom, onRunoff, onManual }: TieDialogProps) {
  const { t } = useTranslation()
  const tied = leaders(session)
  const [shuffling, setShuffling] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  function random() {
    // The winner is chosen securely in the reducer; this is only a short visual shuffle.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onRandom()
      return
    }
    setShuffling(true)
    for (let ms = 0; ms < SHUFFLE_MS; ms += STEP_MS) {
      timers.current.push(window.setTimeout(() => setHighlight((h) => (h + 1) % tied.length), ms))
    }
    timers.current.push(window.setTimeout(onRandom, SHUFFLE_MS))
  }

  const names = tied.map((i) => session.options[i])

  return (
    <Dialog open disablePointerDismissal>
      <DialogContent
        title={t('quickVote.tieTitle')}
        description={t('quickVote.tieText', { options: names.join(', ') })}
      >
        {shuffling ? (
          <div className="flex flex-col gap-2" aria-live="polite">
            <p className="text-sm text-muted-foreground">{t('quickVote.shuffling')}</p>
            {tied.map((index, i) => (
              <div
                key={index}
                className={cn(
                  'rounded-lg border px-3 py-2 text-base transition-colors',
                  i === highlight && 'border-primary bg-accent text-accent-foreground',
                )}
              >
                {session.options[index]}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button size="lg" onClick={random}>
              <Shuffle data-icon="inline-start" />
              {t('quickVote.tieRandom')}
            </Button>
            {session.round === 1 && (
              <Button variant="outline" size="lg" onClick={onRunoff}>
                {t('quickVote.tieRunoff')}
              </Button>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{t('quickVote.tieManual')}</p>
            <div className="flex flex-wrap gap-2">
              {tied.map((index) => (
                <Button key={index} variant="secondary" onClick={() => onManual(index)}>
                  {session.options[index]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

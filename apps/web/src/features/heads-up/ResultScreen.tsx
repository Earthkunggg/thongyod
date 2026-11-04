import { useTranslation } from 'react-i18next'
import { Check, LayoutGrid, RotateCw, Share2, Trophy, X } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { buttonVariants, Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { lineShareUrl } from '@/lib/share'
import { TONE_CLASS } from '@/lib/tones'
import { cn } from '@/lib/utils'
import type { Answer } from './logic'

type Props = {
  answers: Answer[]
  score: number
  packName: string
  isBest: boolean
  shareUrl: string
  onToggle: (index: number) => void
  onAgain: () => void
  onChangePack: () => void
}

// After a round: score, every word with ✓ / ✗ (tap to fix sensor mistakes), play again, share to LINE.
export function ResultScreen({ answers, score, packName, isBest, shareUrl, onToggle, onAgain, onChangePack }: Props) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4 px-3 pb-8">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <span className={cn('flex size-20 items-center justify-center rounded-full', TONE_CLASS.accent)} aria-hidden="true">
          <Trophy className="size-10" />
        </span>
        <h2 className="text-3xl font-medium">{score > 0 ? t('headsUp.resultTitle', { count: score }) : t('headsUp.resultNone')}</h2>
        <p className="text-sm text-muted-foreground">{packName}</p>
        {isBest && score > 0 && <Badge tone="success">{t('headsUp.newBest')}</Badge>}
      </div>

      <Card className="px-2 py-1">
        {answers.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">{t('headsUp.noWords')}</p>
        ) : (
          <ul className="divide-y">
            {answers.map((a, i) => (
              <li key={`${a.word}-${i}`}>
                <button
                  type="button"
                  onClick={() => onToggle(i)}
                  className="flex min-h-12 w-full items-center gap-3 px-2 text-left active:opacity-70"
                  aria-label={`${a.word}: ${a.verdict === 'correct' ? t('headsUp.correctMark') : t('headsUp.passMark')}`}
                >
                  <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', a.verdict === 'correct' ? TONE_CLASS.success : TONE_CLASS.neutral)} aria-hidden="true">
                    {a.verdict === 'correct' ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <span className={cn('flex-1 text-base', a.verdict === 'pass' && 'text-muted-foreground line-through decoration-1')}>{a.word}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {answers.length > 0 && <p className="-mt-2 text-center text-xs text-muted-foreground">{t('headsUp.fixHint')}</p>}

      <div className="flex flex-col gap-2">
        <Button size="lg" onClick={onAgain}>
          <RotateCw data-icon="inline-start" />
          {t('headsUp.again')}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={onChangePack}>
            <LayoutGrid data-icon="inline-start" />
            {t('headsUp.changePack')}
          </Button>
          <a href={lineShareUrl(`${t('headsUp.shareText', { count: score, pack: packName })}\n${shareUrl}`)} target="_blank" rel="noreferrer" className={buttonVariants({ variant: 'outline' })}>
            <Share2 data-icon="inline-start" />
            {t('headsUp.share')}
          </a>
        </div>
      </div>
    </div>
  )
}

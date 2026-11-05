import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// Time left as a bar + mm:ss. Turns to the warning tone in the last 10 seconds.
export function TimerBar({ left, total, className }: { left: number; total: number; className?: string }) {
  const { t } = useTranslation()
  const share = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0
  const low = left <= 10
  const mm = Math.floor(left / 60)
  const ss = `${Math.max(0, left % 60)}`.padStart(2, '0')
  return (
    <div className={cn('flex items-center gap-3', className)} role="timer" aria-label={t('games.timeLeft', { seconds: left })}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-[width] duration-1000 ease-linear', low ? 'bg-tone-warning-foreground' : 'bg-primary')} style={{ width: `${share * 100}%` }} />
      </div>
      <span className={cn('w-12 text-right font-medium tabular-nums', low && 'text-tone-warning-foreground')}>
        {mm}:{ss}
      </span>
    </div>
  )
}

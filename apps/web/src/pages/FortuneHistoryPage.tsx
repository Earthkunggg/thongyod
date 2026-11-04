import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FortuneCard } from '@/features/fortune/FortuneCard'
import { LEVEL_TONE } from '@/features/fortune/levelTone'
import { HISTORY_DAYS, levelOf, type Draw } from '@/features/fortune/logic'
import { loadHistory } from '@/features/fortune/storage'
import { parseDayKey } from '@/features/calendar/month'
import { formatDayLabel } from '@/lib/date'

// /fortune/history — sticks drawn on this device (last 60 days). Tap a day to read that paper again.
export function FortuneHistoryPage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const [history] = useState(loadHistory)
  const [open, setOpen] = useState<Draw | null>(null)

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader title={t('fortune.historyTitle')} subtitle={t('fortune.historyHint', { days: HISTORY_DAYS })} backTo="/fortune" />
      <Card className="mx-3 px-4 py-1">
        {history.length === 0 ? (
          <EmptyState
            title={t('fortune.historyEmpty')}
            action={
              <Link to="/fortune" className={buttonVariants({ size: 'sm' })}>
                {t('fortune.shake')}
              </Link>
            }
          />
        ) : (
          history.map((draw) => {
            const level = levelOf(draw.stick)
            return (
              <button
                key={draw.day}
                type="button"
                onClick={() => setOpen(draw)}
                className="flex min-h-14 w-full items-center gap-3 py-2 text-left active:opacity-70 [&+&]:border-t"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-medium tabular-nums" aria-hidden="true">
                  {draw.stick}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{t('fortune.stickNo', { n: draw.stick })}</span>
                  <span className="block truncate text-xs text-muted-foreground">{formatDayLabel(parseDayKey(draw.day) ?? now, now)}</span>
                </span>
                <Badge tone={LEVEL_TONE[level]}>{t(`fortune.levels.${level}`)}</Badge>
              </button>
            )
          })
        )}
      </Card>
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        {open && (
          <DialogContent title={formatDayLabel(parseDayKey(open.day) ?? now, now)} className="max-h-[85dvh] overflow-y-auto">
            <FortuneCard stick={open.stick} />
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

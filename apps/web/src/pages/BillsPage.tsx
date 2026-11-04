import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CircleCheck, Clock, NotebookPen, Plus } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { billStatus, newBill, settle, type Bill } from '@/features/bill-split/bill'
import { Faces } from '@/features/bill-split/Faces'
import { addBill, useBills } from '@/features/bill-split/storage'
import { intlLocale } from '@/i18n'
import { formatDayLabel } from '@/lib/date'
import { formatBaht } from '@/lib/money'
import { Badge } from '@/components/common/Badge'

// หารบิล home (DECISIONS #53): bills kept on this device, newest first.
export function BillsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const bills = useBills()

  function start() {
    const date = new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short' }).format(new Date())
    const bill = newBill(t('billSplit.defaultTitle', { date }), t('billSplit.me'))
    addBill(bill)
    void navigate(`/bills/${bill.id}`)
  }

  return (
    <>
      <PageHeader title={t('billSplit.title')} subtitle={t('billSplit.subtitle')} backTo="/explore" />
      <div className="flex flex-col gap-4 px-4 pb-8">
        <Button size="lg" onClick={start}>
          <Plus data-icon="inline-start" />
          {t('billSplit.newBill')}
        </Button>
        {bills.length === 0 ? (
          <EmptyState title={t('billSplit.emptyTitle')} hint={t('billSplit.emptyHint')} />
        ) : (
          <ul className="flex flex-col gap-2">
            {bills.map((bill) => (
              <BillRow key={bill.id} bill={bill} />
            ))}
          </ul>
        )}
        <p className="text-center text-xs text-muted-foreground">{t('billSplit.storedHere')}</p>
      </div>
    </>
  )
}

const STATUS_ICON = { jotting: NotebookPen, waiting: Clock, cleared: CircleCheck } as const

function BillRow({ bill }: { bill: Bill }) {
  const { t } = useTranslation()
  const s = settle(bill)
  const { status, waiting } = billStatus(bill, s)
  const Icon = STATUS_ICON[status]
  return (
    <li>
      <Link to={`/bills/${bill.id}`} className="flex flex-col gap-2 rounded-xl border bg-card p-3 active:bg-muted/50">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate font-medium">{bill.title}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatDayLabel(new Date(bill.createdAt))}</span>
        </span>
        <span className="flex items-center gap-2">
          <Faces bill={bill} ids={bill.people.slice(0, 6).map((p) => p.id)} />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {t('billSplit.entriesCount', { count: bill.entries.length })}
            {s.total > 0 && ` · ${formatBaht(s.total)}`}
          </span>
          <Badge tone={status === 'cleared' ? 'success' : status === 'waiting' ? 'warning' : 'neutral'} icon={Icon}>
            {t(`billSplit.status.${status}`, { count: waiting })}
          </Badge>
        </span>
      </Link>
    </li>
  )
}

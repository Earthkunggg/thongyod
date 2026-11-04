import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Cake, Circle, CircleCheck, Receipt, Wallet } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { formatBaht } from '@/lib/money'
import { cn } from '@/lib/utils'
import './bill.css'
import { personColor } from './colors'
import type { BillDraft } from './draft'
import type { SplitResult } from './logic'

type Props = { draft: BillDraft; result: SplitResult; onTogglePaid: (index: number) => void }

// The receipt: prints line by line; tap a friend when they pay you → "จ่ายแล้ว" stamp.
export function ReceiptView({ draft, result, onTogglePaid }: Props) {
  const { t } = useTranslation()
  const [skip, setSkip] = useState(false)
  const step = Math.min(120, 900 / (draft.people.length + 2))
  const payerName = draft.people[draft.payer].trim() || t('billSplit.personN', { n: draft.payer + 1 })

  return (
    <div
      className={cn('rounded-2xl border border-dashed bg-card p-4 font-mono shadow-sm', skip && 'receipt-skip')}
      onPointerDown={() => setSkip(true)}
    >
      <div className="receipt-line mb-3 text-center" style={{ animationDelay: '0ms' }}>
        <p className="flex items-center justify-center gap-2 font-sans text-lg font-medium">
          <Receipt className="size-5" aria-hidden="true" />
          {t('billSplit.receiptTitle')}
        </p>
        <p className="font-sans text-xs text-muted-foreground">{t('billSplit.payTo', { name: payerName })}</p>
      </div>

      <ul className="flex flex-col divide-y divide-dashed">
        {draft.people.map((person, i) => {
          const name = person.trim() || t('billSplit.personN', { n: i + 1 })
          const isPayer = i === draft.payer
          const treated = draft.treated.includes(i)
          const auto = isPayer || treated
          const paid = draft.paid.includes(i)
          return (
            <li key={i} className="receipt-line" style={{ animationDelay: `${(i + 1) * step}ms` }}>
              {auto ? (
                // Payer and treated people never transfer anything: a plain row, not a button.
                <div className="flex items-center gap-3 py-2.5 font-sans">
                  <Avatar name={name} className={personColor(i)} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {treated ? <Cake className="size-3.5" aria-hidden="true" /> : <Wallet className="size-3.5" aria-hidden="true" />}
                      {treated ? t('billSplit.treatedTag') : t('billSplit.payerTag')}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-mono text-base text-muted-foreground tabular-nums">{formatBaht(treated ? 0 : result.amounts[i])}</span>
                    <span className="block text-xs text-muted-foreground">{t('billSplit.noTransfer')}</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  aria-pressed={paid}
                  aria-label={t(paid ? 'billSplit.markUnpaid' : 'billSplit.markPaid', { name })}
                  onClick={() => onTogglePaid(i)}
                  className="relative flex w-full items-center gap-3 py-2.5 text-left font-sans active:bg-muted/50"
                >
                  <Avatar name={name} className={personColor(i)} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                  <span className={cn('font-mono text-base tabular-nums', paid && 'text-muted-foreground line-through')}>{formatBaht(result.amounts[i])}</span>
                  {paid ? <CircleCheck className="size-6 shrink-0 text-primary" aria-hidden="true" /> : <Circle className="size-6 shrink-0 text-muted-foreground/50" aria-hidden="true" />}
                  {paid && (
                    <span
                      className="paid-stamp pointer-events-none absolute top-1/2 right-24 -mt-3.5 rounded-md border-2 border-red-500 px-1.5 text-sm font-bold text-red-500"
                      aria-hidden="true"
                    >
                      {t('billSplit.paidStamp')}
                    </span>
                  )}
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className="receipt-line mt-2 border-t border-dashed pt-2 font-sans text-sm" style={{ animationDelay: `${(draft.people.length + 1) * step}ms` }}>
        <div className="flex justify-between">
          <span>{t('billSplit.totalLabel')}</span>
          <span className="font-mono tabular-nums">{formatBaht(result.total)}</span>
        </div>
        {result.extra > 0 && <p className="mt-1 text-xs text-muted-foreground">{t('billSplit.extraTo', { name: payerName, amount: formatBaht(result.extra) })}</p>}
      </div>
    </div>
  )
}

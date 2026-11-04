import { useTranslation } from 'react-i18next'
import { Cake, Receipt, Wallet } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { formatBaht } from '@/lib/money'
import { cn } from '@/lib/utils'
import { personColor } from './colors'
import type { BillDraft } from './draft'
import type { SplitResult } from './logic'

type Props = { draft: BillDraft; result: SplitResult | null; onReceipt: () => void }

// Sticky bottom card: everyone's amount, live while typing.
export function SummaryBar({ draft, result, onReceipt }: Props) {
  const { t } = useTranslation()
  return (
    <div className="sticky bottom-0 -mx-4 mt-2 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
      {result ? (
        <>
          <ul className="flex gap-3 overflow-x-auto pb-2" aria-live="polite">
            {draft.people.map((person, i) => {
              const name = person.trim() || t('billSplit.personN', { n: i + 1 })
              const treated = draft.treated.includes(i)
              return (
                <li key={i} className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
                  <span className="relative">
                    <Avatar name={name} className={cn('size-10', personColor(i))} />
                    {(treated || draft.payer === i) && (
                      <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border-2 border-background bg-primary text-primary-foreground" aria-hidden="true">
                        {treated ? <Cake className="size-3" /> : <Wallet className="size-3" />}
                      </span>
                    )}
                  </span>
                  <span className="w-full truncate text-xs text-muted-foreground">{name}</span>
                  <span className="text-sm font-medium tabular-nums">{formatBaht(treated ? 0 : result.amounts[i])}</span>
                </li>
              )
            })}
          </ul>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span>{t('billSplit.total', { amount: formatBaht(result.total) })}</span>
            {result.extra > 0 && (
              <span className="text-xs text-muted-foreground">
                {t('billSplit.extra', { amount: formatBaht(result.extra) })}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className="mb-2 text-center text-sm text-muted-foreground">{t('billSplit.emptyHint')}</p>
      )}
      <Button size="lg" className="w-full" disabled={!result} onClick={onReceipt}>
        <Receipt data-icon="inline-start" />
        {t('billSplit.showReceipt')}
      </Button>
    </div>
  )
}

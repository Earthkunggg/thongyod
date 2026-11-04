import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, RotateCcw, Share2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { allSettled, checkDraft, newDraft, toggle, type BillDraft } from '@/features/bill-split/draft'
import { ItemsSection } from '@/features/bill-split/ItemsSection'
import { PeopleSection } from '@/features/bill-split/PeopleSection'
import { ReceiptView } from '@/features/bill-split/ReceiptView'
import { SummaryBar } from '@/features/bill-split/SummaryBar'
import { loadDraft, saveDraft } from '@/features/bill-split/storage'
import { celebrate } from '@/lib/celebrate'
import { formatBaht } from '@/lib/money'
import { lineShareUrl } from '@/lib/share'
import { cn } from '@/lib/utils'

// Quick bill split on one phone (DECISIONS #50): people → equal or by item → receipt with "จ่ายแล้ว" stamps.
export function BillSplitPage() {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<BillDraft>(() => loadDraft() ?? newDraft(t('billSplit.me'), t('billSplit.personN', { n: 2 })))
  const [view, setView] = useState<'edit' | 'receipt'>('edit')
  const [confirmNew, setConfirmNew] = useState(false)

  useEffect(() => saveDraft(draft), [draft])

  const { result, badItems, totalInvalid } = checkDraft(draft)
  const nameOf = (i: number) => draft.people[i].trim() || t('billSplit.personN', { n: i + 1 })

  function togglePaid(index: number) {
    const next = { ...draft, paid: toggle(draft.paid, index) }
    setDraft(next)
    if (!allSettled(draft) && allSettled(next)) {
      celebrate()
      navigator.vibrate?.(30)
    }
  }

  function shareText(): string {
    if (!result) return ''
    const lines = draft.people.map((_, i) => {
      if (draft.treated.includes(i)) return t('billSplit.shareTreated', { name: nameOf(i) })
      const amount = formatBaht(result.amounts[i])
      return i === draft.payer ? t('billSplit.sharePayer', { name: nameOf(i), amount }) : t('billSplit.shareLine', { name: nameOf(i), amount })
    })
    return [t('billSplit.shareTitle', { total: formatBaht(result.total) }), ...lines, t('billSplit.payTo', { name: nameOf(draft.payer) })].join('\n')
  }

  const everyonePaid = allSettled(draft)

  return (
    <>
      <PageHeader title={t('billSplit.title')} subtitle={view === 'edit' ? t('billSplit.subtitle') : undefined} backTo="/explore" />

      {view === 'edit' || !result ? (
        <div className="flex flex-col gap-6 px-4">
          <PeopleSection draft={draft} onChange={setDraft} />

          <SegmentedChoice<BillDraft['mode']>
            label={t('billSplit.mode')}
            value={draft.mode}
            onChange={(mode) => setDraft({ ...draft, mode })}
            options={[
              { value: 'equal', label: t('billSplit.modeEqual') },
              { value: 'items', label: t('billSplit.modeItems') },
            ]}
          />

          {draft.mode === 'equal' ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t('billSplit.billTotal')}</span>
              <div className="relative">
                <Input
                  value={draft.totalText}
                  inputMode="decimal"
                  placeholder="0"
                  aria-invalid={totalInvalid || undefined}
                  className="h-14 pr-14 text-right text-2xl tabular-nums"
                  onChange={(e) => setDraft({ ...draft, totalText: e.target.value })}
                />
                <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground">{t('billSplit.bahtUnit')}</span>
              </div>
              {totalInvalid && (
                <span role="alert" className="text-sm text-destructive">
                  {t('billSplit.badAmount')}
                </span>
              )}
            </label>
          ) : (
            <ItemsSection draft={draft} badItems={badItems} onChange={setDraft} />
          )}

          <SummaryBar draft={draft} result={result} onReceipt={() => setView('receipt')} />
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-4 pb-8">
          <ReceiptView draft={draft} result={result} onTogglePaid={togglePaid} />

          <p className={cn('text-center text-sm', everyonePaid ? 'font-medium text-primary' : 'text-muted-foreground')} role="status">
            {everyonePaid ? t('billSplit.allPaid') : t('billSplit.tapToMark')}
          </p>

          <a href={lineShareUrl(shareText())} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
            <Share2 data-icon="inline-start" />
            {t('billSplit.shareButton')}
          </a>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setView('edit')}>
              <Pencil data-icon="inline-start" />
              {t('billSplit.edit')}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmNew(true)}>
              <RotateCcw data-icon="inline-start" />
              {t('billSplit.newBill')}
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmNew}
        onOpenChange={setConfirmNew}
        title={t('billSplit.newBillTitle')}
        description={t('billSplit.newBillText')}
        confirmLabel={t('billSplit.newBill')}
        destructive
        onConfirm={() => {
          // Keep the same friends; clear the money.
          setDraft({ ...newDraft('', ''), people: draft.people, payer: draft.payer })
          setView('edit')
        }}
      />
    </>
  )
}

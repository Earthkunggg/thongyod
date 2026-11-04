import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Circle, CircleCheck, QrCode, Share2, Wallet } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { celebrate } from '@/lib/celebrate'
import { formatBaht } from '@/lib/money'
import { lineShareUrl } from '@/lib/share'
import { cn } from '@/lib/utils'
import { billStatus, priceGroups, setPrice, settle, toggleSettled, type Bill, type PriceGroup } from './bill'
import { Face } from './Faces'
import { formatBahtPlain } from './format'
import { parseBaht } from './logic'
import { usePersonName } from './names'
import { PersonChip } from './PersonChip'
import { PromptPayDialog } from './PromptPayDialog'
import { TONE_TEXT } from '@/lib/tones'

type Props = { bill: Bill; onChange: (change: (bill: Bill) => Bill) => void }

// "หาร": 1 fill missing prices → 2 who paid the shop → 3 who transfers to whom.
export function SplitTab({ bill, onChange }: Props) {
  const { t } = useTranslation()
  const nameOf = usePersonName(bill)
  const s = settle(bill)
  const groups = priceGroups(bill)
  const ownPayers = bill.entries.some((e) => e.payerId !== null)
  const [qrFor, setQrFor] = useState<string | null>(null)
  const qrTransfer = s.transfers.find((tr) => tr.key === qrFor)

  function toggle(key: string) {
    const next = toggleSettled(bill, key)
    if (billStatus(bill, s).status !== 'cleared' && billStatus(next).status === 'cleared') {
      celebrate()
      navigator.vibrate?.(30)
    }
    onChange(() => next)
  }

  const shareText = [
    t('billSplit.shareTitle', { title: bill.title, total: formatBaht(s.total) }),
    ...(s.transfers.length > 0
      ? s.transfers.map((tr) => t('billSplit.shareLine', { from: nameOf(tr.from), to: nameOf(tr.to), amount: formatBaht(tr.amount) }))
      : [t('billSplit.noTransfers')]),
  ].join('\n')

  if (bill.entries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t('billSplit.splitEmpty')}</p>
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <Step n={1} title={t('billSplit.step1')}>
        {s.unpriced > 0 && <p className={cn('text-xs', TONE_TEXT.warning)}>{t('billSplit.missingPrices', { count: s.unpriced })}</p>}
        <ul className="flex flex-col gap-2">
          {groups.map((g) => (
            <PriceRow key={g.key} group={g} onSave={(price) => onChange((b) => setPrice(b, g.key, price))} />
          ))}
        </ul>
      </Step>

      <Step n={2} title={t('billSplit.step2')}>
        <div className="flex flex-wrap gap-2">
          {bill.people.map((p, i) => (
            <PersonChip key={p.id} index={i} name={nameOf(p.id)} icon={Wallet} pressed={bill.payerId === p.id} onClick={() => onChange((b) => ({ ...b, payerId: p.id }))} />
          ))}
        </div>
        {ownPayers && <p className="text-xs text-muted-foreground">{t('billSplit.someOwnPayers')}</p>}
      </Step>

      <Step n={3} title={t('billSplit.step3')}>
        {s.transfers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('billSplit.noTransfers')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {s.transfers.map((tr) => {
              const done = bill.settled.includes(tr.key)
              const what = s.portions[tr.from]
                .slice(0, 3)
                .map((p) => p.name)
                .join(', ')
              return (
                <li key={tr.key} className={cn('flex items-stretch overflow-hidden rounded-xl border bg-card', done && 'opacity-60')}>
                  <button
                    type="button"
                    aria-pressed={done}
                    onClick={() => toggle(tr.key)}
                    className="flex min-w-0 flex-1 items-center gap-2 p-3 text-left active:bg-muted/50"
                  >
                    <Face bill={bill} id={tr.from} className="size-9 text-sm" />
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <Face bill={bill} id={tr.to} className="size-9 text-sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{t('billSplit.transfer', { from: nameOf(tr.from), to: nameOf(tr.to) })}</span>
                      {what && <span className="block truncate text-xs text-muted-foreground">{what}</span>}
                    </span>
                    <span className={cn('text-base font-medium tabular-nums', done && 'line-through')}>{formatBaht(tr.amount)}</span>
                    {done ? <CircleCheck className="size-6 shrink-0 text-primary" aria-hidden="true" /> : <Circle className="size-6 shrink-0 text-muted-foreground/50" aria-hidden="true" />}
                  </button>
                  {!done && (
                    <button
                      type="button"
                      onClick={() => setQrFor(tr.key)}
                      aria-label={`${t('billSplit.promptPay.open')} ${t('billSplit.transfer', { from: nameOf(tr.from), to: nameOf(tr.to) })}`}
                      className="flex w-12 shrink-0 items-center justify-center border-l text-primary active:bg-muted/50"
                    >
                      <QrCode className="size-5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        <div className="flex items-baseline justify-between text-sm">
          <span>{t('billSplit.total', { amount: formatBaht(s.total) })}</span>
          {s.extra > 0 && <span className="text-xs text-muted-foreground">{t('billSplit.extra', { amount: formatBaht(s.extra) })}</span>}
        </div>
        {billStatus(bill, s).status === 'cleared' && (
          <p className="text-center text-sm font-medium text-primary" role="status">
            {t('billSplit.allDone')}
          </p>
        )}
        {qrTransfer && (
          <PromptPayDialog
            key={qrTransfer.key}
            open
            onOpenChange={(open) => !open && setQrFor(null)}
            payeeName={nameOf(qrTransfer.to)}
            payerName={nameOf(qrTransfer.from)}
            amountSatang={qrTransfer.amount}
          />
        )}
        <details className="rounded-xl border bg-card px-3 py-2 text-sm [&_summary]:cursor-pointer">
          <summary className="text-sm">{t('billSplit.details')}</summary>
          <ul className="mt-2 flex flex-col gap-2">
            {bill.people.map((p) => {
              const own = s.portions[p.id].reduce((sum, x) => sum + x.amount, 0)
              const cover = s.consumed[p.id] - own
              return (
                <li key={p.id} className="flex gap-2">
                  <Face bill={bill} id={p.id} />
                  <span className="min-w-0 flex-1 text-xs text-muted-foreground">
                    <span className="block text-sm text-foreground">{nameOf(p.id)}</span>
                    {s.portions[p.id].map((x) => `${x.name} ${formatBaht(x.amount)}`).join(' · ') || t('billSplit.nothing')}
                    {cover !== 0 && <span className="block">{cover > 0 ? t('billSplit.coverTreat', { amount: formatBaht(cover) }) : t('billSplit.treatedTag')}</span>}
                  </span>
                  <span className="text-right text-xs tabular-nums">
                    <span className="block">{t('billSplit.share', { amount: formatBaht(s.consumed[p.id]) })}</span>
                    <span className="block text-muted-foreground">{t('billSplit.paidAmount', { amount: formatBaht(s.paid[p.id]) })}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </details>
        <a href={lineShareUrl(shareText)} target="_blank" rel="noreferrer" className={buttonVariants({ size: 'lg' })}>
          <Share2 data-icon="inline-start" />
          {t('billSplit.shareButton')}
        </a>
      </Step>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <span className="grid size-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground" aria-hidden="true">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function PriceRow({ group, onSave }: { group: PriceGroup; onSave: (price: number | null) => void }) {
  const { t } = useTranslation()
  const [text, setText] = useState(group.price !== null ? formatBahtPlain(group.price) : '')
  const invalid = text.trim() !== '' && parseBaht(text) === null
  return (
    <li className={cn('flex items-center gap-2 rounded-xl border bg-card p-2 pl-3', group.price === null && 'border-tone-warning-foreground/40')}>
      <span className="min-w-0 flex-1 truncate text-sm">
        {group.name} <span className="text-muted-foreground">×{group.qty}</span>
      </span>
      <span className="text-xs text-muted-foreground">{t('billSplit.perUnit')}</span>
      <Input
        value={text}
        inputMode="decimal"
        placeholder="0"
        aria-label={t('billSplit.unitPriceOf', { name: group.name })}
        aria-invalid={invalid || undefined}
        className="w-24 text-right"
        onChange={(e) => {
          const next = e.target.value
          setText(next)
          if (next.trim() === '') onSave(null)
          else {
            const price = parseBaht(next)
            if (price !== null) onSave(price)
          }
        }}
      />
    </li>
  )
}

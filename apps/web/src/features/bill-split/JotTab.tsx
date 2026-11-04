import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { NotebookPen, Plus } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { SuggestionChips } from '@/components/common/SuggestionChips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatBaht } from '@/lib/money'
import { bumpEntry, itemKey, jot, MAX_ITEM_LENGTH, priceOf, recentNames, type Bill, type Entry } from './bill'
import { EntryDialog } from './EntryDialog'
import { FacePicker, Faces } from './Faces'
import { parseBaht } from './logic'

type Props = { bill: Bill; onChange: (change: (bill: Bill) => Bill) => void }

// "จด": note who ordered what while eating. Price is optional; it can be filled in on "หาร".
export function JotTab({ bill, onChange }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [priceText, setPriceText] = useState('')
  const [eaters, setEaters] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const listEnd = useRef<HTMLDivElement>(null)
  const count = bill.entries.length
  const knownPrice = name.trim() ? bill.prices[itemKey(name)] : undefined
  const priceInvalid = priceText.trim() !== '' && parseBaht(priceText) === null

  // Newest entry comes in at the bottom, like a chat.
  useEffect(() => {
    listEnd.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [count])

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || priceInvalid) return
    onChange((b) => jot(b, { name, price: priceText.trim() ? parseBaht(priceText) : null, eaters }))
    setName('')
    setPriceText('')
    setEaters([])
    nameInput.current?.focus()
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">
        {count === 0 ? (
          <EmptyState title={t('billSplit.jotEmpty')} hint={t('billSplit.jotEmptyHint')} />
        ) : (
          <ul className="flex flex-col gap-2">
            {bill.entries.map((entry) => (
              <EntryRow key={entry.id} bill={bill} entry={entry} onEdit={() => setEditing(entry.id)} onPlusOne={() => onChange((b) => bumpEntry(b, entry.id, 1))} />
            ))}
          </ul>
        )}
        <div ref={listEnd} />
      </div>

      {/* The jot bar stays at the bottom while eating. */}
      <form onSubmit={submit} className="sticky bottom-0 -mx-4 mt-2 flex flex-col gap-2 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        {recentNames(bill).length > 0 && (
          <div className="-mx-4 overflow-x-auto px-4">
            <SuggestionChips
              label={t('billSplit.recent')}
              items={recentNames(bill)}
              onPick={(item) => {
                setName(item)
                nameInput.current?.focus()
              }}
            />
          </div>
        )}
        <div className="flex gap-2">
          <Input
            ref={nameInput}
            value={name}
            maxLength={MAX_ITEM_LENGTH}
            placeholder={t('billSplit.whatPlaceholder')}
            aria-label={t('billSplit.whatOrdered')}
            className="min-w-0"
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            value={priceText}
            inputMode="decimal"
            placeholder={knownPrice !== undefined ? formatBaht(knownPrice) : t('billSplit.price')}
            aria-label={t('billSplit.priceOptional')}
            aria-invalid={priceInvalid || undefined}
            className="w-24 shrink-0 text-right"
            onChange={(e) => setPriceText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <FacePicker bill={bill} value={eaters} onChange={setEaters} label={t('billSplit.whose')} />
          </div>
          <Button type="submit" disabled={!name.trim() || priceInvalid}>
            <NotebookPen data-icon="inline-start" />
            {t('billSplit.jot')}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {priceInvalid ? t('billSplit.badAmount') : eaters.length === 0 ? t('billSplit.whoseEveryone') : t('billSplit.whoseCount', { count: eaters.length })}
        </p>
      </form>

      {editing && <EntryDialog bill={bill} entryId={editing} onClose={() => setEditing(null)} onChange={onChange} />}
    </div>
  )
}

function EntryRow({ bill, entry, onEdit, onPlusOne }: { bill: Bill; entry: Entry; onEdit: () => void; onPlusOne: () => void }) {
  const { t } = useTranslation()
  const price = priceOf(bill, entry)
  const sharers = entry.eaters.length > 0 ? entry.eaters.length : bill.people.length
  return (
    <li className="flex items-center gap-2 rounded-xl border bg-card p-2 pl-3">
      <button type="button" onClick={onEdit} className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left" aria-label={t('billSplit.editEntryNamed', { name: entry.name })}>
        <span className="flex w-full items-baseline gap-1.5">
          <span className="truncate text-sm font-medium">{entry.name}</span>
          {entry.qty > 1 && <span className="shrink-0 text-sm text-muted-foreground">×{entry.qty}</span>}
        </span>
        {entry.eaters.length > 0 ? <Faces bill={bill} ids={entry.eaters} /> : <span className="text-xs text-muted-foreground">{t('billSplit.everyone')}</span>}
      </button>
      {price === null ? (
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{t('billSplit.noPrice')}</span>
      ) : (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {sharers > 1 ? t('billSplit.perPerson', { amount: formatBaht(Math.ceil((price * entry.qty) / sharers)) }) : formatBaht(price * entry.qty)}
        </span>
      )}
      <Button variant="outline" size="icon" aria-label={t('billSplit.plusOne', { name: entry.name })} onClick={onPlusOne}>
        <Plus />
      </Button>
    </li>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Wallet } from 'lucide-react'
import { NumberStepper } from '@/components/common/NumberStepper'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatBahtPlain } from './format'
import { itemKey, MAX_ITEM_LENGTH, MAX_QTY, removeEntry, setPrice, updateEntry, type Bill } from './bill'
import { FacePicker } from './Faces'
import { parseBaht } from './logic'
import { usePersonName } from './names'
import { PersonChip } from './PersonChip'

type Props = { bill: Bill; entryId: string; onClose: () => void; onChange: (change: (bill: Bill) => Bill) => void }

// Edit one jotted entry: name, how many, who shares it, who paid it (for trips), unit price.
export function EntryDialog({ bill, entryId, onClose, onChange }: Props) {
  const { t } = useTranslation()
  const nameOf = usePersonName(bill)
  const entry = bill.entries.find((e) => e.id === entryId)
  const [name, setName] = useState(entry?.name ?? '')
  const [qty, setQty] = useState(entry?.qty ?? 1)
  const [eaters, setEaters] = useState(entry?.eaters ?? [])
  const [payerId, setPayerId] = useState<string | null>(entry?.payerId ?? null)
  const known = entry ? bill.prices[itemKey(entry.name)] : undefined
  const [priceText, setPriceText] = useState(known !== undefined ? formatBahtPlain(known) : '')
  if (!entry) return null
  const priceInvalid = priceText.trim() !== '' && parseBaht(priceText) === null

  function save() {
    if (!name.trim() || priceInvalid) return
    const clean = name.trim()
    onChange((b) => setPrice(updateEntry(b, entryId, { name: clean, qty, eaters, payerId }), itemKey(clean), priceText.trim() ? parseBaht(priceText) : null))
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={t('billSplit.editEntry')} className="max-h-[85dvh] overflow-y-auto">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('billSplit.whatOrdered')}</span>
          <Input value={name} maxLength={MAX_ITEM_LENGTH} onChange={(e) => setName(e.target.value)} aria-invalid={!name.trim() || undefined} />
        </label>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{t('billSplit.qty')}</span>
          <NumberStepper label={t('billSplit.qty')} value={qty} min={1} max={MAX_QTY} onChange={setQty} />
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('billSplit.unitPrice')}</span>
          <Input value={priceText} inputMode="decimal" placeholder={t('billSplit.noPrice')} aria-invalid={priceInvalid || undefined} onChange={(e) => setPriceText(e.target.value)} />
          <span className="text-xs text-muted-foreground">{priceInvalid ? t('billSplit.badAmount') : t('billSplit.unitPriceHint', { name: name.trim() || entry.name })}</span>
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('billSplit.whose')}</span>
          <FacePicker bill={bill} value={eaters} onChange={setEaters} label={t('billSplit.whose')} />
          <span className="text-xs text-muted-foreground">{eaters.length === 0 ? t('billSplit.whoseEveryone') : t('billSplit.whoseCount', { count: eaters.length })}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{t('billSplit.paidBy')}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={payerId === null}
              onClick={() => setPayerId(null)}
              className={payerId === null ? 'h-10 rounded-full border-2 border-primary bg-primary/10 px-3 text-sm font-medium' : 'h-10 rounded-full border-2 border-transparent bg-muted/60 px-3 text-sm'}
            >
              {t('billSplit.paidByShop', { name: nameOf(bill.payerId) })}
            </button>
            {bill.people.map((p, i) => (
              <PersonChip key={p.id} index={i} name={nameOf(p.id)} icon={Wallet} pressed={payerId === p.id} onClick={() => setPayerId(p.id)} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Button
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              onChange((b) => removeEntry(b, entryId))
              onClose()
            }}
          >
            <Trash2 data-icon="inline-start" />
            {t('billSplit.deleteEntry')}
          </Button>
          <Button onClick={save} disabled={!name.trim() || priceInvalid}>
            {t('billSplit.save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

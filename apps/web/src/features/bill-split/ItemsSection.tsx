import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { personColor } from './colors'
import { addItem, removeItem, toggle, updateItem, type BillDraft } from './draft'
import { MAX_ITEMS } from './logic'

type Props = { draft: BillDraft; badItems: number[]; onChange: (draft: BillDraft) => void }

// "แยกรายการ": each dish + tap the faces of who ate it. Nobody tapped = everyone shares it.
export function ItemsSection({ draft, badItems, onChange }: Props) {
  const { t } = useTranslation()
  return (
    <section className="flex flex-col gap-3" aria-labelledby="bill-items">
      <h2 id="bill-items" className="text-sm font-medium">
        {t('billSplit.items')}
      </h2>
      <ul className="flex flex-col gap-3">
        {draft.items.map((item, i) => {
          const itemLabel = item.name.trim() || t('billSplit.itemN', { n: i + 1 })
          const bad = badItems.includes(i)
          return (
            <li key={i} className="flex flex-col gap-2 rounded-xl border bg-card p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={item.name}
                  maxLength={40}
                  placeholder={t('billSplit.itemN', { n: i + 1 })}
                  aria-label={t('billSplit.itemName', { n: i + 1 })}
                  onChange={(e) => onChange(updateItem(draft, i, { name: e.target.value }))}
                />
                <Input
                  value={item.priceText}
                  inputMode="decimal"
                  placeholder="0"
                  className="w-24 text-right"
                  aria-label={t('billSplit.itemPrice', { name: itemLabel })}
                  aria-invalid={bad || undefined}
                  onChange={(e) => onChange(updateItem(draft, i, { priceText: e.target.value }))}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('billSplit.removeItem', { name: itemLabel })}
                  onClick={() => onChange(removeItem(draft, i))}
                >
                  <X />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t('billSplit.whoAte', { name: itemLabel })}>
                {draft.people.map((person, p) => {
                  const name = person.trim() || t('billSplit.personN', { n: p + 1 })
                  const on = item.eaters.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      aria-label={name}
                      onClick={() => onChange(updateItem(draft, i, { eaters: toggle(item.eaters, p) }))}
                      className={cn('rounded-full transition-[opacity,transform] active:scale-90', on ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : 'opacity-35')}
                    >
                      <Avatar name={name} className={cn('size-8 text-xs', personColor(p))} />
                    </button>
                  )
                })}
                {item.eaters.length === 0 && (
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {t('billSplit.everyone')}
                  </span>
                )}
              </div>
              {bad && (
                <p role="alert" className="text-xs text-destructive">
                  {t('billSplit.badAmount')}
                </p>
              )}
            </li>
          )
        })}
      </ul>
      {draft.items.length < MAX_ITEMS && (
        <Button variant="ghost" className="self-start" onClick={() => onChange(addItem(draft))}>
          <Plus data-icon="inline-start" />
          {t('billSplit.addItem')}
        </Button>
      )}
    </section>
  )
}

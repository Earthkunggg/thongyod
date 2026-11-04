import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChipSelect } from '@/components/common/ChipSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BUDGETS, CATEGORIES, NAME_MAX, NOTE_MAX, type Budget, type Category, type Restaurant } from '@/features/restaurants/logic'
import { upsertRestaurant } from '@/features/restaurants/storage'

type Props = { open: boolean; onOpenChange: (open: boolean) => void; restaurant: Restaurant | null }

// Add or edit a pinned restaurant: name, type, budget band (optional), note.
export function RestaurantDialog({ open, onOpenChange, restaurant }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState(restaurant?.name ?? '')
  const [category, setCategory] = useState<Category>(restaurant?.category ?? 'tamsang')
  const [budget, setBudget] = useState<Budget | null>(restaurant?.budget ?? null)
  const [note, setNote] = useState(restaurant?.note ?? '')

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    upsertRestaurant({ id: restaurant?.id, name, category, budget, note })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={restaurant ? t('restaurants.edit') : t('restaurants.add')} className="max-h-[90dvh] overflow-y-auto">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Input value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} placeholder={t('restaurants.namePlaceholder')} aria-label={t('restaurants.name')} autoFocus />
          <p className="text-xs font-medium">{t('restaurants.filterCategory')}</p>
          <ChipSelect<Category>
            single
            label={t('restaurants.filterCategory')}
            value={[category]}
            onChange={(v) => setCategory(v[0])}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`restaurants.categories.${c}`) }))}
          />
          <p className="text-xs font-medium">
            {t('restaurants.filterBudget')} ({t('restaurants.budgetUnit')})
          </p>
          <ChipSelect<Budget | 'unknown'>
            single
            label={t('restaurants.filterBudget')}
            value={[budget ?? 'unknown']}
            onChange={(v) => setBudget(v[0] === 'unknown' ? null : v[0])}
            options={[...BUDGETS.map((b) => ({ value: b, label: t(`restaurants.budgets.${b}`) })), { value: 'unknown' as const, label: t('restaurants.priceUnknown') }]}
          />
          <Input value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} placeholder={t('restaurants.notePlaceholder')} aria-label={t('restaurants.note')} />
          <Button type="submit" disabled={!name.trim()}>
            {t('restaurants.save')}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t('restaurants.private')}</p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Sparkles, Store, X } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { RestaurantDialog } from '@/components/restaurants/RestaurantDialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SAMPLE_RESTAURANTS } from '@/config/sampleRestaurants'
import type { Restaurant } from '@/features/restaurants/logic'
import { removeRestaurant, restoreRestaurant, upsertRestaurant, useRestaurants } from '@/features/restaurants/storage'
import { useRestaurantSubtitle } from '@/features/restaurants/useRestaurantSubtitle'
import { showUndoToast } from '@/lib/toast'

// /restaurants — "ร้านของฉัน": places I pinned (device only, private). Tap to edit, ✕ to remove (undo).
export function MyRestaurantsPage() {
  const { t } = useTranslation()
  const places = useRestaurants()
  const subtitle = useRestaurantSubtitle()
  const [editing, setEditing] = useState<Restaurant | 'new' | null>(null)

  return (
    <div className="flex flex-col gap-3 pb-28">
      <PageHeader title={t('restaurants.mine')} subtitle={t('restaurants.mineSubtitle', { count: places.length })} backTo="/random-restaurant" />
      {places.length === 0 ? (
        <Card className="mx-3">
          <EmptyState
            title={t('restaurants.empty')}
            hint={t('restaurants.emptyHint')}
            action={
              <Button variant="outline" onClick={() => SAMPLE_RESTAURANTS.forEach((s) => upsertRestaurant({ ...s, note: '' }))}>
                <Sparkles data-icon="inline-start" />
                {t('restaurants.trySamples')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="mx-3 px-4 py-1">
          {places.map((r) => (
            <div key={r.id} className="flex min-h-14 items-center gap-3 py-2 [&+&]:border-t">
              <button type="button" onClick={() => setEditing(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground" aria-hidden="true">
                  <Store className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{subtitle(r)}</span>
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`${t('restaurants.remove')} ${r.name}`}
                onClick={() => {
                  const removed = removeRestaurant(r.id)
                  if (removed) showUndoToast({ title: t('restaurants.removed', { name: removed.name }), onUndo: () => restoreRestaurant(removed) })
                }}
              >
                <X />
              </Button>
            </div>
          ))}
        </Card>
      )}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <Button size="lg" className="w-full" onClick={() => setEditing('new')}>
          <Plus data-icon="inline-start" />
          {t('restaurants.add')}
        </Button>
      </div>
      {editing && <RestaurantDialog key={editing === 'new' ? 'new' : editing.id} open onOpenChange={(o) => !o && setEditing(null)} restaurant={editing === 'new' ? null : editing} />}
    </div>
  )
}

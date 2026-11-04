import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CircleSlash, MapPinPlus, Share2, Shuffle, SlidersHorizontal, Sparkles, Store, Utensils } from 'lucide-react'
import { ChipSelect } from '@/components/common/ChipSelect'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { SoundToggle } from '@/components/common/SoundToggle'
import { SpinWheel } from '@/components/common/SpinWheel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { SAMPLE_RESTAURANTS } from '@/config/sampleRestaurants'
import { markDone } from '@/features/daily/daily'
import {
  BUDGETS,
  CATEGORIES,
  CATEGORY_GROUP,
  GROUPS,
  NO_FILTERS,
  applyFilters,
  drawNext,
  exclude,
  filterKey,
  newRound,
  remaining,
  restart,
  type Budget,
  type Category,
  type Filters,
  type Group,
  type Restaurant,
  type Round,
} from '@/features/restaurants/logic'
import { markVisited, upsertRestaurant, useRestaurants } from '@/features/restaurants/storage'
import { useRestaurantSubtitle } from '@/features/restaurants/useRestaurantSubtitle'
import { spinTarget, tickTimes } from '@/features/wheel/logic'
import { celebrate } from '@/lib/celebrate'
import { secureRandomInt } from '@/lib/random'
import { appUrl, lineShareUrl } from '@/lib/share'
import { playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { toastManager } from '@/lib/toast'
import { cn } from '@/lib/utils'

type ShowAs = 'wheel' | 'instant'
const WHEEL_MAX = 12
const SPIN_MS = 1200
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// /random-restaurant — สุ่มร้าน, first version (spec §8, M3): only places I pinned, no Google, no location.
// Rounds (spec §8.4): no repeats inside a round; filters change → new round; nothing matches → ask, never widen.
export function RandomRestaurantPage() {
  const { t } = useTranslation()
  const places = useRestaurants()
  const subtitle = useRestaurantSubtitle()
  const sound = useGameSound('restaurants')
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [roundState, setRound] = useState<Round>(() => newRound(filterKey(NO_FILTERS)))
  const [showAs, setShowAs] = useState<ShowAs>('wheel')
  const [showList, setShowList] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Restaurant | null>(null)
  const [state, setState] = useState<'idle' | 'empty' | 'exhausted'>('idle')
  const ticks = useRef<number[]>([])
  const wheelBox = useRef<HTMLDivElement>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const key = filterKey(filters)
  // Changing filters starts a new round (excluded places stay out only within the same filters).
  const round = roundState.key === key ? roundState : newRound(key)
  const candidates = useMemo(() => applyFilters(places, filters), [places, filters])
  const left = candidates.filter((r) => !round.shown.includes(r.id) && !round.excluded.includes(r.id))
  const wheelOk = left.length >= 2 && left.length <= WHEEL_MAX
  const useWheel = showAs === 'wheel' && wheelOk && !reducedMotion()
  const activeFilters = filters.groups.length + filters.categories.length + filters.budgets.length + (filters.includeUnknownPrice ? 0 : 1) + (filters.onlyNew ? 1 : 0)
  const categories = CATEGORIES.filter((c) => filters.groups.length === 0 || filters.groups.includes(CATEGORY_GROUP[c]))

  function setFilter(patch: Partial<Filters>) {
    setFilters((f) => ({ ...f, ...patch }))
    setState('idle')
  }

  function pick() {
    if (spinning) return
    unlockSound()
    const draw = drawNext(candidates, round, secureRandomInt)
    if (draw.kind !== 'picked') {
      setState(draw.kind)
      return
    }
    setState('idle')
    const chosen = places.find((p) => p.id === draw.id)!
    markDone('tool')
    if (!useWheel) {
      setRound(draw.round)
      setResult(chosen)
      if (sound) playSound('pop')
      return
    }
    // Winner decided first (fair), then the wheel animates to it (UX §8).
    const index = left.findIndex((r) => r.id === draw.id)
    const target = spinTarget(rotation, index, left.length, (secureRandomInt(1000) / 1000 - 0.5) * 0.7)
    setSpinning(true)
    setRotation(target)
    wheelBox.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    if (sound) {
      const borders = Math.round(Math.abs(target - rotation) / (360 / left.length))
      ticks.current = tickTimes(borders, SPIN_MS).map((ms) => window.setTimeout(() => playSound('tick', 0.8), ms))
    }
    window.setTimeout(() => {
      setSpinning(false)
      setRound(draw.round)
      setResult(chosen)
      if (sound) playSound('end')
    }, SPIN_MS + 80)
  }

  function closeResult() {
    setResult(null)
  }

  function go(r: Restaurant) {
    markVisited(r.id)
    celebrate()
    toastManager.add({ title: t('restaurants.visitedToast', { name: r.name }) })
    setResult(null)
  }

  if (places.length === 0) {
    return (
      <>
        <PageHeader title={t('restaurants.title')} subtitle={t('restaurants.subtitle')} backTo="/explore" />
        <Card className="mx-3">
          <EmptyState
            title={t('restaurants.empty')}
            hint={t('restaurants.emptyHint')}
            action={
              <div className="flex flex-col gap-2">
                <Link to="/restaurants" className={buttonVariants()}>
                  <MapPinPlus data-icon="inline-start" />
                  {t('restaurants.addFirst')}
                </Link>
                <Button variant="outline" onClick={() => SAMPLE_RESTAURANTS.forEach((s) => upsertRestaurant({ ...s, note: '' }))}>
                  <Sparkles data-icon="inline-start" />
                  {t('restaurants.trySamples')}
                </Button>
              </div>
            }
          />
        </Card>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-28">
      <PageHeader
        title={t('restaurants.title')}
        subtitle={t('restaurants.subtitle')}
        backTo="/explore"
        action={
          <span className="flex items-center">
            <SoundToggle game="restaurants" />
            <Link to="/restaurants" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={t('restaurants.mine')}>
              <Store className="size-5" />
            </Link>
          </span>
        }
      />

      <Card className="mx-3 flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">
            {t('restaurants.found', { count: candidates.length })}
            {candidates.length > 0 && <span className="font-normal text-muted-foreground"> · {t('restaurants.left', { count: remaining(candidates, round) })}</span>}
          </span>
          {candidates.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowList((s) => !s)} aria-expanded={showList}>
              {showList ? t('restaurants.hideList') : t('restaurants.showList')}
            </Button>
          )}
        </div>
        {showList && (
          <ul className="flex flex-col divide-y text-sm">
            {candidates.map((r) => (
              <li key={r.id} className={cn('py-1.5', (round.shown.includes(r.id) || round.excluded.includes(r.id)) && 'text-muted-foreground line-through')}>
                {r.name} <span className="text-xs text-muted-foreground">· {subtitle(r)}</span>
              </li>
            ))}
          </ul>
        )}
        <SegmentedChoice<ShowAs>
          label={t('restaurants.showAs')}
          value={showAs}
          onChange={setShowAs}
          options={[
            { value: 'wheel', label: t('restaurants.asWheel') },
            { value: 'instant', label: t('restaurants.asInstant') },
          ]}
        />
        {showAs === 'wheel' && left.length > WHEEL_MAX && <p className="text-xs text-muted-foreground">{t('restaurants.wheelTooMany')}</p>}
      </Card>
      {useWheel && (
        <div ref={wheelBox} className="mx-auto w-full max-w-[280px] scroll-mt-24 px-3">
          <SpinWheel options={left.map((r) => r.name)} rotation={rotation} durationMs={spinning ? SPIN_MS : 0} onSpinEnd={() => undefined} onTap={pick} label={t('restaurants.spin')} />
        </div>
      )}
      <details className="mx-3 rounded-xl border bg-card [&_summary]:cursor-pointer" open={filtersOpen} onToggle={(e) => setFiltersOpen(e.currentTarget.open)}>
        <summary className="flex min-h-12 items-center gap-2 px-4 text-sm font-medium">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          {t('restaurants.filters', { count: activeFilters })}
        </summary>
        <div className="flex flex-col gap-1 pb-3">
      <section>
        <SectionHeader title={t('restaurants.filterGroup')} />
        <div className="px-4">
          <ChipSelect<Group>
            label={t('restaurants.filterGroup')}
            value={filters.groups}
            onChange={(groups) => setFilter({ groups, categories: filters.categories.filter((c) => groups.length === 0 || groups.includes(CATEGORY_GROUP[c])) })}
            options={GROUPS.map((g) => ({ value: g, label: t(`restaurants.groups.${g}`) }))}
          />
        </div>
      </section>
      <section>
        <SectionHeader title={t('restaurants.filterCategory')} />
        <div className="px-4">
          <ChipSelect<Category>
            label={t('restaurants.filterCategory')}
            value={filters.categories}
            onChange={(categories) => setFilter({ categories })}
            options={categories.map((c) => ({ value: c, label: t(`restaurants.categories.${c}`) }))}
          />
        </div>
      </section>
      <section>
        <SectionHeader title={`${t('restaurants.filterBudget')} (${t('restaurants.budgetUnit')})`} />
        <div className="flex flex-col gap-1 px-4">
          <ChipSelect<Budget>
            label={t('restaurants.filterBudget')}
            value={filters.budgets}
            onChange={(budgets) => setFilter({ budgets })}
            options={BUDGETS.map((b) => ({ value: b, label: t(`restaurants.budgets.${b}`) }))}
          />
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            {t('restaurants.includeUnknown')}
            <Switch checked={filters.includeUnknownPrice} onCheckedChange={(on) => setFilter({ includeUnknownPrice: on })} aria-label={t('restaurants.includeUnknown')} />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
            {t('restaurants.onlyNew')}
            <Switch checked={filters.onlyNew} onCheckedChange={(on) => setFilter({ onlyNew: on })} aria-label={t('restaurants.onlyNew')} />
          </label>
        </div>
      </section>

        </div>
      </details>


      {state === 'empty' && (
        <Card className="mx-3">
          <EmptyState
            title={t('restaurants.noMatch')}
            hint={t('restaurants.noMatchHint')}
            action={
              <Button variant="outline" onClick={() => setFilter(NO_FILTERS)}>
                {t('restaurants.clearFilters')}
              </Button>
            }
          />
        </Card>
      )}
      {state === 'exhausted' && (
        <Card className="mx-3">
          <EmptyState
            title={t('restaurants.exhausted')}
            hint={t('restaurants.exhaustedHint')}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setRound(restart(round))
                  setState('idle')
                }}
              >
                <Shuffle data-icon="inline-start" />
                {t('restaurants.newRound')}
              </Button>
            }
          />
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <Button size="lg" className="w-full" onClick={pick} disabled={spinning}>
          <Utensils data-icon="inline-start" />
          {t('restaurants.spin')}
        </Button>
      </div>

      <Dialog open={result !== null} onOpenChange={(open) => !open && closeResult()}>
        {result && (
          <DialogContent title={t('restaurants.resultTitle')}>
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="font-heading text-2xl font-medium">{result.name}</p>
              <p className="text-sm text-muted-foreground">{subtitle(result)}</p>
              {result.note && <p className="text-xs text-muted-foreground">{result.note}</p>}
            </div>
            <Button size="lg" onClick={() => go(result)}>
              {t('restaurants.go')}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null)
                  window.setTimeout(pick, 50)
                }}
              >
                <Shuffle data-icon="inline-start" />
                {t('restaurants.reroll')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setRound(exclude(round, result.id))
                  toastManager.add({ title: t('restaurants.excluded', { name: result.name }) })
                  setResult(null)
                }}
              >
                <CircleSlash data-icon="inline-start" />
                {t('restaurants.exclude')}
              </Button>
            </div>
            <a
              href={lineShareUrl(`${t('restaurants.shareText', { name: result.name, category: t(`restaurants.categories.${result.category}`) })}\n${appUrl('/random-restaurant')}`)}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: 'ghost' })}
            >
              <Share2 data-icon="inline-start" />
              {t('restaurants.share')}
            </a>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

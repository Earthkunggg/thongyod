import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHome } from '@/api/home'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FeedRow } from '@/components/home/FeedRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { groupByDay } from '@/features/calendar/month'
import { formatDayLabel } from '@/lib/date'

// /updates — every "อัปเดตจากเพื่อน" item, grouped by day (newest first).
// Uses the /home feed for now; a paged feed endpoint comes later (#43 pattern, see HANDOFF).
export function UpdatesPage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const home = useHome()
  const days = useMemo(() => {
    const feed = [...(home.data?.feed ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return [...groupByDay(feed.map((item) => ({ ...item, startsAt: item.createdAt }))).values()]
  }, [home.data])

  return (
    <div className="flex flex-col gap-1 pb-8">
      <PageHeader title={t('home.friendsUpdates')} backTo="/" />
      {home.isPending ? (
        <LoadingState rows={4} />
      ) : home.isError ? (
        <ErrorState onRetry={() => void home.refetch()} />
      ) : days.length === 0 ? (
        <EmptyState title={t('home.feedEmpty')} />
      ) : (
        days.map((items) => (
          <section key={items[0].id}>
            <SectionHeader title={formatDayLabel(new Date(items[0].createdAt), now)} />
            <Card className="mx-3 px-4 py-1">
              {items.map((item) => (
                <FeedRow key={item.id} item={item} now={now} />
              ))}
            </Card>
          </section>
        ))
      )}
    </div>
  )
}

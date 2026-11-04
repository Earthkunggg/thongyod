import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CheckCheck, Settings } from 'lucide-react'
import { useMarkNotificationsRead, useNotifications } from '@/api/notifications'
import type { AppNotification } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageHeader } from '@/components/layout/PageHeader'
import { NotificationRow } from '@/components/notifications/NotificationRow'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useInfiniteScroll } from '@/lib/useInfiniteScroll'

/** Where a notification opens. null = stay (e.g. a cancelled meetup has nothing to open). */
function targetPath(item: AppNotification): string | null {
  const target = item.target
  if (!target) return null
  switch (target.type) {
    case 'meetup':
      return `/meetups/${target.id}`
    case 'user':
      return `/u/${target.id}`
    case 'gang':
      return `/gangs/${target.id}`
    case 'friend_requests':
      return '/gangs/friends'
  }
}

// /notifications — opened from the bell on Home. New (unread) first, then earlier ones; paged (#43).
// Tap = mark read + open. "อ่านทั้งหมด" in the header.
export function NotificationsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const list = useNotifications()
  const markRead = useMarkNotificationsRead()
  const sentinel = useInfiniteScroll(list)

  const items = list.data?.pages.flatMap((p) => p.items) ?? []
  const unread = list.data?.pages[0]?.unreadCount ?? 0
  const groups = [
    { key: 'new', title: t('notifications.new'), items: items.filter((n) => !n.readAt) },
    { key: 'earlier', title: t('notifications.earlier'), items: items.filter((n) => n.readAt) },
  ].filter((g) => g.items.length > 0)

  function open(item: AppNotification) {
    if (!item.readAt) markRead.mutate([item.id])
    const path = targetPath(item)
    if (path) void navigate(path)
  }

  return (
    <div className="flex flex-col gap-1 pb-8">
      <PageHeader
        title={t('notifications.title')}
        backTo="/"
        action={
          <span className="flex items-center">
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markRead.mutate(undefined)}>
                <CheckCheck data-icon="inline-start" />
                {t('notifications.readAll')}
              </Button>
            )}
            <Link to="/settings/notifications" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={t('notifications.settings')}>
              <Settings className="size-5" />
            </Link>
          </span>
        }
      />
      {list.isPending ? (
        <LoadingState rows={5} />
      ) : list.isError && !list.data ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState title={t('notifications.empty')} hint={t('notifications.emptyHint')} />
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <SectionHeader title={group.title} />
            <Card className="mx-3 divide-y px-4 py-0">
              {group.items.map((item) => (
                <NotificationRow key={item.id} item={item} now={now} onOpen={() => open(item)} />
              ))}
            </Card>
          </section>
        ))
      )}
      <div ref={sentinel} className="flex min-h-6 flex-col items-center px-3 pt-2 text-xs text-muted-foreground" aria-live="polite">
        {list.isFetchingNextPage && <Skeleton className="h-14 w-full rounded-xl" aria-label={t('common.loading')} />}
        {list.isFetchNextPageError && (
          <Button variant="outline" size="sm" onClick={() => void list.fetchNextPage()}>
            {t('common.loadMore')}
          </Button>
        )}
        {list.data && !list.hasNextPage && list.data.pages.length > 1 && <span className="py-2">{t('common.endOfList')}</span>}
      </div>
    </div>
  )
}

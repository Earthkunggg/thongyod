import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CheckCheck, ChevronRight } from 'lucide-react'
import { useMarkNotificationsRead, useNotifications } from '@/api/notifications'
import type { AppNotification } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { NotificationRow } from '@/components/notifications/NotificationRow'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button, buttonVariants } from '@/components/ui/button'
import { targetPath } from '@/features/notifications/target'
import { cn } from '@/lib/utils'

/** The sheet shows the newest ones; the rest are on /notifications. */
const PREVIEW = 12

// Bell on Home → this sheet slides up (no page change). "ดูทั้งหมด" opens the full page (#75).
export function NotificationsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])
  const list = useNotifications()
  const markRead = useMarkNotificationsRead()
  const items = (list.data?.pages.flatMap((p) => p.items) ?? []).slice(0, PREVIEW)
  const unread = list.data?.pages[0]?.unreadCount ?? 0
  const groups = [
    { key: 'new', title: t('notifications.new'), items: items.filter((n) => !n.readAt) },
    { key: 'earlier', title: t('notifications.earlier'), items: items.filter((n) => n.readAt) },
  ].filter((g) => g.items.length > 0)

  function openItem(item: AppNotification) {
    if (!item.readAt) markRead.mutate([item.id])
    const path = targetPath(item)
    if (path) {
      onOpenChange(false)
      void navigate(path)
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('notifications.title')}
      action={
        unread > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markRead.mutate(undefined)}>
            <CheckCheck data-icon="inline-start" />
            {t('notifications.readAll')}
          </Button>
        )
      }
      footer={
        <Link to="/notifications" onClick={() => onOpenChange(false)} className={cn(buttonVariants({ variant: 'ghost' }), 'w-full')}>
          {t('common.seeAll')}
          <ChevronRight data-icon="inline-end" />
        </Link>
      }
    >
      {list.isPending ? (
        <LoadingState rows={4} />
      ) : list.isError && !list.data ? (
        <ErrorState onRetry={() => void list.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState title={t('notifications.empty')} hint={t('notifications.emptyHint')} />
      ) : (
        groups.map((group) => (
          <section key={group.key} className="pb-1">
            <SectionHeader title={group.title} />
            <div className="divide-y px-4">
              {group.items.map((item) => (
                <NotificationRow key={item.id} item={item} now={now} onOpen={() => openItem(item)} />
              ))}
            </div>
          </section>
        ))
      )}
    </BottomSheet>
  )
}

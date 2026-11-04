import { useTranslation } from 'react-i18next'
import { Award, Bell, CalendarClock, CalendarPlus, CalendarX, Receipt, Settings2, UserCheck, UserPlus, type LucideIcon } from 'lucide-react'
import type { AppNotification, NotificationKind } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { formatTimeAgo } from '@/lib/date'
import { notificationText } from '@/lib/describe'
import { TONE_CLASS, type Tone } from '@/lib/tones'
import { cn } from '@/lib/utils'

const KIND: Record<NotificationKind, { icon: LucideIcon; tone: Tone }> = {
  meetup_invite: { icon: CalendarPlus, tone: 'accent' },
  meetup_time_changed: { icon: CalendarClock, tone: 'warning' },
  meetup_cancelled: { icon: CalendarX, tone: 'danger' },
  meetup_reminder: { icon: Bell, tone: 'info' },
  friend_request: { icon: UserPlus, tone: 'accent' },
  friend_accepted: { icon: UserCheck, tone: 'success' },
  bill_reminder: { icon: Receipt, tone: 'warning' },
  title_earned: { icon: Award, tone: 'accent' },
  gang_settings_changed: { icon: Settings2, tone: 'neutral' },
}

// One notification: who (avatar + small kind icon), the sentence, time ago, and a dot while unread.
// Tapping is handled by the parent (mark read + open the target).
export function NotificationRow({ item, now, onOpen }: { item: AppNotification; now: Date; onOpen: () => void }) {
  const { t } = useTranslation()
  const { icon: Icon, tone } = KIND[item.kind]
  const unread = item.readAt === null
  return (
    <button type="button" onClick={onOpen} className="flex min-h-16 w-full items-center gap-3 py-2.5 text-left active:opacity-70">
      <span className="relative shrink-0">
        {item.actor ? (
          <Avatar name={item.actor.displayName} src={item.actor.avatarUrl} className="size-10" />
        ) : (
          <span className={cn('flex size-10 items-center justify-center rounded-full', TONE_CLASS[tone])} aria-hidden="true">
            <Icon className="size-5" />
          </span>
        )}
        {item.actor && (
          <span className={cn('absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ring-card', TONE_CLASS[tone])} aria-hidden="true">
            <Icon className="size-3" />
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('line-clamp-2 text-sm', unread && 'font-medium')}>{notificationText(item, now)}</span>
        <span className="block text-xs text-muted-foreground">{formatTimeAgo(new Date(item.createdAt), now)}</span>
      </span>
      {unread && (
        <span className="size-2.5 shrink-0 rounded-full bg-primary">
          <span className="sr-only">{t('notifications.unread')}</span>
        </span>
      )}
    </button>
  )
}

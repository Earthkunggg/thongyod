import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { AvatarStack } from '@/components/common/AvatarStack'
import type { MeetupListItem } from '@/api/types'
import { formatDayCompact, formatTime } from '@/lib/date'
import { ResponseChip } from './ResponseChip'

// One meetup in a day agenda: time | title, gang, who is going | my answer | ›. Opens the detail page.
// showDay: lists that mix days (gang page, profile) show "พรุ่งนี้" / "24 พ.ย." above the time.
export function MeetupRow({ meetup, showDay = false }: { meetup: MeetupListItem; showDay?: boolean }) {
  const start = new Date(meetup.startsAt)
  return (
    <Link to={`/meetups/${meetup.id}`} className="flex min-h-16 items-center gap-3 py-2 active:opacity-70 [&+&]:border-t">
      <span className={showDay ? 'flex w-16 shrink-0 flex-col' : 'w-12 shrink-0'}>
        {showDay && <span className="truncate text-xs text-muted-foreground">{formatDayCompact(start)}</span>}
        <span className="text-sm font-medium tabular-nums">{formatTime(start)}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{meetup.title}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{meetup.gangName}</span>
          <AvatarStack names={meetup.goingAvatars.map((p) => p.displayName)} total={meetup.counts.going} />
        </span>
      </span>
      <ResponseChip response={meetup.myResponse} />
      <ChevronRight className="-mr-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </Link>
  )
}

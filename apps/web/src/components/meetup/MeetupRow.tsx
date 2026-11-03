import { Link } from 'react-router'
import { AvatarStack } from '@/components/common/AvatarStack'
import type { MeetupListItem } from '@/api/types'
import { formatTime } from '@/lib/date'
import { ResponseChip } from './ResponseChip'

// One meetup in a day agenda: time | title, gang, who is going | my answer. Opens the detail page.
export function MeetupRow({ meetup }: { meetup: MeetupListItem }) {
  return (
    <Link to={`/meetups/${meetup.id}`} className="flex min-h-16 items-center gap-3 py-2 active:opacity-70 [&+&]:border-t">
      <span className="w-12 shrink-0 text-sm font-medium tabular-nums">{formatTime(new Date(meetup.startsAt))}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{meetup.title}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{meetup.gangName}</span>
          <AvatarStack names={meetup.goingPreview.map((p) => p.displayName)} total={meetup.counts.going} />
        </span>
      </span>
      <ResponseChip response={meetup.myResponse} />
    </Link>
  )
}

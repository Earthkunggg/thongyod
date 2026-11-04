import { useTranslation } from 'react-i18next'
import { Clock, Users } from 'lucide-react'
import type { MeetupListItem } from '@/api/types'
import { AvatarStack } from '@/components/common/AvatarStack'
import { formatDayLabel, formatTime, formatTimeUntil } from '@/lib/date'
import { HideMeetupButton } from './HideMeetupButton'

type InviteCardProps = {
  meetup: MeetupListItem
  now: Date
  /** Shown only when I may hide it (not my own meetup, decision #32). */
  onHide?: () => void
}

// Face of an invite in the swipe deck: what, which gang, when, who is going.
export function InviteCard({ meetup, now, onHide }: InviteCardProps) {
  const { t } = useTranslation()
  const startsAt = new Date(meetup.startsAt)
  const countdown = formatTimeUntil(startsAt, now)
  return (
    <div className="flex flex-col gap-3 p-5 pt-14">
      <div>
        <p className="text-xs text-muted-foreground">{meetup.gangName}</p>
        <h3 className="text-xl font-medium">{meetup.title}</h3>
      </div>
      <p className="flex items-center gap-2 text-sm">
        <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
        {formatDayLabel(startsAt, now)} {formatTime(startsAt)}
        {countdown && <span className="rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">{countdown}</span>}
      </p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="size-4" aria-hidden="true" />
        <AvatarStack names={meetup.goingAvatars.map((p) => p.displayName)} total={meetup.counts.going} />
        {t('meetup.countsShort', { going: meetup.counts.going, maybe: meetup.counts.maybe })}
      </p>
      {onHide && (
        <div className="-mb-3 flex justify-center">
          <HideMeetupButton onClick={onHide} />
        </div>
      )}
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Clock, Info, UserRound, Users } from 'lucide-react'
import type { MeetupListItem } from '@/api/types'
import { AvatarStack } from '@/components/common/AvatarStack'
import { formatDayLabel, formatTime, formatTimeUntil } from '@/lib/date'
import { HideMeetupButton } from './HideMeetupButton'

type InviteCardProps = {
  meetup: MeetupListItem
  now: Date
  /** Shown only when I may hide it (not my own meetup, decision #32). */
  onHide?: () => void
  /** "ดูรายละเอียด" button (the whole card can also be tapped). */
  onOpen?: () => void
  /** Full-page deck: more details on the card. */
  tall?: boolean
}

// Face of an invite in the swipe deck: what, which gang, when, who is going.
export function InviteCard({ meetup, now, onHide, onOpen, tall }: InviteCardProps) {
  const { t } = useTranslation()
  const startsAt = new Date(meetup.startsAt)
  const countdown = formatTimeUntil(startsAt, now)
  return (
    <div className="flex flex-1 flex-col gap-3 p-5 pt-14">
      {onOpen && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={t('meetup.openDetails', { title: meetup.title })}
          className="absolute top-3 right-3 grid size-9 place-items-center rounded-full text-muted-foreground active:bg-muted"
        >
          <Info className="size-5" />
        </button>
      )}
      <div>
        <p className="text-xs text-muted-foreground">{meetup.gangName}</p>
        <h3 className={tall ? 'text-2xl font-medium' : 'text-xl font-medium'}>{meetup.title}</h3>
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
      {tall && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserRound className="size-4" aria-hidden="true" />
          {t('meetup.createdBy', { name: meetup.createdBy.displayName })}
        </p>
      )}
      <p className="mt-auto text-center text-xs text-muted-foreground">{t('meetup.tapForDetails')}</p>
      {onHide && (
        <div className="-mt-2 -mb-3 flex justify-center">
          <HideMeetupButton onClick={onHide} />
        </div>
      )}
    </div>
  )
}

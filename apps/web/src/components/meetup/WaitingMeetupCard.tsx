import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { MeetupResponse } from '@thongyod/shared'
import type { MeetupListItem } from '@/api/types'
import { Card } from '@/components/ui/card'
import { formatDayLabel, formatTime, formatTimeUntil } from '@/lib/date'
import { cn } from '@/lib/utils'
import { HideMeetupButton } from './HideMeetupButton'
import { ResponsePicker } from './ResponsePicker'

type WaitingMeetupCardProps = {
  meetup: MeetupListItem
  now: Date
  onAnswer: (response: MeetupResponse) => void
  onHide: () => void
  /** False for my own meetups: the creator cannot hide them (decision #32). */
  canHide: boolean
  /** Plays the slide-away animation (the card is answered). */
  leaving?: boolean
}

// A meetup I have not answered yet ("รอคุณตอบ"). Answering slides it away into the agenda.
export function WaitingMeetupCard({ meetup, now, onAnswer, onHide, canHide, leaving }: WaitingMeetupCardProps) {
  const { t } = useTranslation()
  const startsAt = new Date(meetup.startsAt)
  const countdown = formatTimeUntil(startsAt, now)

  return (
    <Card
      className={cn(
        'p-4 transition-[transform,opacity] duration-200 ease-in motion-reduce:transition-none',
        leaving && 'translate-x-full opacity-0',
      )}
    >
      <Link to={`/meetups/${meetup.id}`} className="block active:opacity-70">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-medium">{meetup.title}</h3>
          {countdown && (
            <span className="shrink-0 rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">
              {countdown}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {meetup.gangName} · {formatDayLabel(startsAt, now)} {formatTime(startsAt)} ·{' '}
          {t('meetup.countsShort', { going: meetup.counts.going, maybe: meetup.counts.maybe })}
        </p>
      </Link>
      <div className="mt-3">
        <ResponsePicker value={meetup.myResponse} onChange={onAnswer} label={meetup.title} disabled={leaving} />
      </div>
      {canHide && (
        <div className="-mb-2 flex justify-center">
          <HideMeetupButton onClick={onHide} disabled={leaving} />
        </div>
      )}
    </Card>
  )
}

import { useTranslation } from 'react-i18next'
import type { MeetupResponse, MeetupSummary } from '@thongyod/shared'
import { Card } from '@/components/ui/card'
import { ResponsePicker } from '@/components/meetup/ResponsePicker'
import { formatDayLabel, formatTime, formatTimeUntil } from '@/lib/date'

type NextMeetupCardProps = {
  meetup: MeetupSummary
  now: Date
  onRespond: (response: MeetupResponse) => void
}

// The next meetup with one-tap ไป / อาจจะ / ไม่ไป.
export function NextMeetupCard({ meetup, now, onRespond }: NextMeetupCardProps) {
  const { t } = useTranslation()
  const startsAt = new Date(meetup.startsAt)
  const countdown = formatTimeUntil(startsAt, now)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{t('home.nextMeetup')}</span>
        {countdown && (
          <span className="rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">
            {countdown}
          </span>
        )}
      </div>
      <h3 className="mt-0.5 text-base font-medium">{meetup.title}</h3>
      <p className="text-sm text-muted-foreground">
        {meetup.gangName} · {formatDayLabel(startsAt, now)} {formatTime(startsAt)} ·{' '}
        {t('meetup.countsShort', { going: meetup.counts.going, maybe: meetup.counts.maybe })}
      </p>
      <div className="mt-3">
        <ResponsePicker value={meetup.myResponse} onChange={onRespond} label={meetup.title} />
      </div>
    </Card>
  )
}

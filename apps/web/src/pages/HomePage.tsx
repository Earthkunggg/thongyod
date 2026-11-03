import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckSquare, Receipt, Utensils, type LucideIcon } from 'lucide-react'
import type { MeetupResponse, MeetupSummary, PendingKind } from '@thongyod/shared'
import { Avatar } from '@/components/common/Avatar'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { SectionHeader } from '@/components/common/SectionHeader'
import { NextMeetupCard } from '@/components/home/NextMeetupCard'
import { PetCard } from '@/components/home/PetCard'
import { WeekStrip } from '@/components/home/WeekStrip'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDayLabel, formatMonthYear, formatTime, formatTimeAgo, isSameDay } from '@/lib/date'
import { feedText, pendingSubtitle, pendingTitle } from '@/lib/describe'
import { getHomeMock } from '@/mocks/home'

const PENDING_ICONS: Record<PendingKind, LucideIcon> = {
  vote_time: CheckSquare,
  vote_restaurant: Utensils,
  pay_bill: Receipt,
  confirm_payment: Receipt,
}

/** Returns the meetup with the new response and updated counts. */
function withResponse(meetup: MeetupSummary, response: MeetupResponse): MeetupSummary {
  if (meetup.myResponse === response) return meetup
  const counts = { ...meetup.counts }
  if (meetup.myResponse) counts[meetup.myResponse] -= 1
  counts[response] += 1
  return { ...meetup, counts, myResponse: response }
}

export function HomePage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const [home, setHome] = useState(() => getHomeMock(now))
  const [selectedDay, setSelectedDay] = useState(now)

  const meetupDays = home.weekMeetups.map((m) => new Date(m.startsAt))
  const isTodaySelected = isSameDay(selectedDay, now)
  const selectedDayMeetups = home.weekMeetups.filter((m) => isSameDay(new Date(m.startsAt), selectedDay))

  // Optimistic update: change the screen now; the API call is added when the backend exists.
  function respond(meetupId: string, response: MeetupResponse) {
    setHome((prev) => ({
      ...prev,
      weekMeetups: prev.weekMeetups.map((m) => (m.id === meetupId ? withResponse(m, response) : m)),
      nextMeetup:
        prev.nextMeetup?.id === meetupId ? withResponse(prev.nextMeetup, response) : prev.nextMeetup,
    }))
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <PageHeader
        title={formatMonthYear(now)}
        subtitle={t('home.subtitle', { count: home.weekMeetups.length })}
        action={
          <Button variant="ghost" size="icon" aria-label={t('common.notifications')}>
            <Bell />
          </Button>
        }
      />

      <WeekStrip today={now} selected={selectedDay} onSelect={setSelectedDay} markedDays={meetupDays} />

      {/* Another day selected: show that day's meetups. Today selected: show the next meetup card. */}
      {!isTodaySelected ? (
        <section className="px-3">
          <Card className="px-4 py-1">
            {selectedDayMeetups.length > 0 ? (
              selectedDayMeetups.map((m) => (
                <ListRow
                  key={m.id}
                  title={m.title}
                  subtitle={`${formatTime(new Date(m.startsAt))} · ${m.gangName}`}
                />
              ))
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t('home.noMeetupOnDay', { day: formatDayLabel(selectedDay, now) })}
              </p>
            )}
          </Card>
        </section>
      ) : (
        home.nextMeetup && (
          <section className="px-3">
            <NextMeetupCard
              meetup={home.nextMeetup}
              now={now}
              onRespond={(r) => respond(home.nextMeetup!.id, r)}
            />
          </section>
        )
      )}

      {home.pending.length > 0 && (
        <section>
          <SectionHeader title={t('home.pendingTitle', { count: home.pending.length })} />
          <Card className="mx-3 px-4 py-1">
            {home.pending.map((item) => (
              <ListRow
                key={item.id}
                leading={<IconTile icon={PENDING_ICONS[item.kind]} />}
                title={pendingTitle(item)}
                subtitle={pendingSubtitle(item, now)}
              />
            ))}
          </Card>
        </section>
      )}

      <section className="px-3">
        <PetCard pet={home.pet} luckyColor={home.luckyColor} />
      </section>

      {home.feed.length > 0 && (
        <section>
          <SectionHeader title={t('home.friendsUpdates')} />
          <Card className="mx-3 px-4 py-1">
            {home.feed.map((item) => (
              <ListRow
                key={item.id}
                leading={<Avatar name={item.actorName} />}
                title={feedText(item)}
                subtitle={`${item.gangName} · ${formatTimeAgo(new Date(item.createdAt), now)}`}
              />
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

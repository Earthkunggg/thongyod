import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, CheckSquare, Receipt, Utensils, type LucideIcon } from 'lucide-react'
import type { MeetupResponse, PendingKind } from '@thongyod/shared'
import { useHome } from '@/api/home'
import { useMeetupsInRange } from '@/api/meetups'
import type { MeetupListItem } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PetCard } from '@/components/home/PetCard'
import { WeekStrip } from '@/components/home/WeekStrip'
import { PageHeader } from '@/components/layout/PageHeader'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { WaitingMeetupCard } from '@/components/meetup/WaitingMeetupCard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DEFAULT_HOME_SECTIONS, type HomeSectionId } from '@/config/home'
import { isAnswerLocked } from '@/features/meetups/rules'
import { useMeetupActions } from '@/features/meetups/useMeetupActions'
import { addDays, formatDayLabel, formatMonthYear, formatTimeAgo, isSameDay, startOfDay, startOfWeek } from '@/lib/date'
import { feedText, pendingSubtitle, pendingTitle } from '@/lib/describe'

const PENDING_ICONS: Record<PendingKind, LucideIcon> = {
  vote_time: CheckSquare,
  vote_restaurant: Utensils,
  pay_bill: Receipt,
  confirm_payment: Receipt,
}

/** How far ahead "รอคุณตอบ" looks. */
const WAITING_DAYS_AHEAD = 14
/** Matches the card's slide-away transition (duration-200). */
const LEAVE_MS = 200

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function HomePage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const [selectedDay, setSelectedDay] = useState(now)
  const [leavingIds, setLeavingIds] = useState<string[]>([])
  const actions = useMeetupActions()

  // One request covers this week (week strip + agenda) and the next 2 weeks ("รอคุณตอบ").
  const range = useMemo(() => {
    const from = startOfWeek(now)
    const to = new Date(Math.max(addDays(from, 7).getTime(), addDays(startOfDay(now), WAITING_DAYS_AHEAD + 1).getTime()))
    return { from: from.toISOString(), to: to.toISOString() }
  }, [now])
  const meetupsQuery = useMeetupsInRange(range.from, range.to)
  const homeQuery = useHome()

  const meetups = (meetupsQuery.data ?? []).filter((m) => !m.myHidden)
  const weekEnd = addDays(startOfWeek(now), 7)
  const weekMeetups = meetups.filter((m) => new Date(m.startsAt) < weekEnd)
  const waiting = meetups.filter((m) => m.myResponse === null && !isAnswerLocked(new Date(m.startsAt), now))
  const waitingIds = new Set(waiting.map((m) => m.id))
  const dayMeetups = weekMeetups.filter((m) => isSameDay(new Date(m.startsAt), selectedDay))
  const agenda = dayMeetups.filter((m) => !waitingIds.has(m.id))

  // Slide the card away first, then save (the card leaves the list and joins the agenda).
  function answer(meetup: MeetupListItem, response: MeetupResponse) {
    const delay = prefersReducedMotion() ? 0 : LEAVE_MS
    setLeavingIds((ids) => [...ids, meetup.id])
    window.setTimeout(() => {
      actions.answer(meetup, response)
      setLeavingIds((ids) => ids.filter((id) => id !== meetup.id))
    }, delay)
  }

  const home = homeQuery.data
  const sections: Record<HomeSectionId, ReactNode> = {
    waiting: waiting.length > 0 && (
      <section>
        <SectionHeader title={t('home.waitingTitle', { count: waiting.length })} />
        <div className="flex flex-col gap-3 overflow-x-clip px-3">
          {waiting.map((m) => (
            <WaitingMeetupCard
              key={m.id}
              meetup={m}
              now={now}
              leaving={leavingIds.includes(m.id)}
              onAnswer={(r) => answer(m, r)}
              onHide={() => actions.hide(m, true)}
            />
          ))}
        </div>
      </section>
    ),

    agenda: (
      <section>
        <SectionHeader title={t('home.agendaTitle', { day: formatDayLabel(selectedDay, now) })} />
        {meetupsQuery.isPending ? (
          <LoadingState rows={2} />
        ) : meetupsQuery.isError ? (
          <ErrorState onRetry={() => void meetupsQuery.refetch()} />
        ) : (
          <Card className="mx-3 px-4 py-1">
            {agenda.length > 0 ? (
              agenda.map((m) => <MeetupRow key={m.id} meetup={m} />)
            ) : (
              <EmptyState
                title={t(dayMeetups.length > 0 ? 'home.onlyWaitingOnDay' : 'home.noMeetupOnDay', {
                  day: formatDayLabel(selectedDay, now),
                })}
              />
            )}
          </Card>
        )}
      </section>
    ),

    pending: home && home.pending.length > 0 && (
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
    ),

    // Hidden until the pet is activated (decision #35).
    pet: home?.pet && (
      <section className="px-3">
        <PetCard pet={home.pet} luckyColor={home.luckyColor} />
      </section>
    ),

    feed: home && home.feed.length > 0 && (
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
    ),
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      <PageHeader
        title={formatMonthYear(now)}
        subtitle={meetupsQuery.isSuccess ? t('home.subtitle', { count: weekMeetups.length }) : undefined}
        action={
          <Button variant="ghost" size="icon" aria-label={t('common.notifications')}>
            <Bell />
          </Button>
        }
      />

      <WeekStrip
        today={now}
        selected={selectedDay}
        onSelect={setSelectedDay}
        markedDays={weekMeetups.map((m) => new Date(m.startsAt))}
      />

      {DEFAULT_HOME_SECTIONS.map((id) => (
        <Fragment key={id}>{sections[id]}</Fragment>
      ))}

      {homeQuery.isError && <ErrorState onRetry={() => void homeQuery.refetch()} />}
    </div>
  )
}

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useHome } from '@/api/home'
import { useMe } from '@/api/profile'
import { useMeetupsInRange } from '@/api/meetups'
import type { MeetupListItem } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { IconTile } from '@/components/common/IconTile'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SwipeDeck } from '@/components/common/SwipeDeck'
import { HScroll } from '@/components/common/HScroll'
import { SeeAllLink } from '@/components/common/SeeAllLink'
import { PENDING_ICONS } from '@/config/pending'
import { DailyMissions } from '@/components/home/DailyMissions'
import { DiscoverRow } from '@/components/home/DiscoverRow'
import { Highlights } from '@/components/home/Highlights'
import { HomeGreeting } from '@/components/home/HomeGreeting'
import { QuickTools } from '@/components/home/QuickTools'
import { WeekStrip } from '@/components/home/WeekStrip'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { InviteCard } from '@/components/meetup/InviteCard'
import { Card } from '@/components/ui/card'
import type { HomeSectionId } from '@/config/home'
import { canHide, isLocked } from '@/features/meetups/derive'
import { SWIPE_TO_RESPONSE, useInviteActions } from '@/features/meetups/useInviteActions'
import { useMeetupActions } from '@/features/meetups/useMeetupActions'
import { homeRange } from '@/features/meetups/useWaiting'
import { markDone, streakOf, useDaily } from '@/features/daily/daily'
import { getMyPet } from '@/features/onboarding/storage'
import { useHomeLayout } from '@/features/settings/homeLayout'
import { addDays, formatDayLabel, formatTimeAgo, isSameDay, startOfWeek } from '@/lib/date'
import { feedText, pendingSubtitle, pendingTitle } from '@/lib/describe'

/** Sideways rows on Home show this many; the rest are behind "ดูทั้งหมด". */
const ROW_PREVIEW = 4


export function HomePage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const [selectedDay, setSelectedDay] = useState(now)
  const actions = useMeetupActions()
  const navigate = useNavigate()
  const layout = useHomeLayout()
  const daily = useDaily()

  useEffect(() => {
    document.title = t('app.title')
  }, [t])
  const [myPet] = useState(getMyPet)

  // One request covers this week (week strip + agenda) and the next 2 weeks ("รอคุณตอบ").
  const range = useMemo(() => homeRange(now), [now])
  const meetupsQuery = useMeetupsInRange(range.from, range.to)
  const homeQuery = useHome()
  const me = useMe()

  const meetups = (meetupsQuery.data ?? []).filter((m) => !m.myState.hidden)
  const weekEnd = addDays(startOfWeek(now), 7)
  const weekMeetups = meetups.filter((m) => new Date(m.startsAt) < weekEnd)
  const waiting = meetups.filter((m) => m.myResponse === null && !isLocked(m, now))
  const waitingIds = new Set(waiting.map((m) => m.id))
  const dayMeetups = weekMeetups.filter((m) => isSameDay(new Date(m.startsAt), selectedDay))
  const agenda = dayMeetups.filter((m) => !waitingIds.has(m.id))

  // Swipe deck (DECISIONS #46, #57): right = ไป, left = ไม่ไป, up = อาจจะ. Buttons do the same; tap = full details.
  const swipeActions = useInviteActions()
  const openInvite = (id: string) => void navigate(`/meetups/${id}?invite=1`)

  const home = homeQuery.data
  const sections: Record<HomeSectionId, ReactNode> = {
    waiting: waiting.length > 0 && (
      <section className="flex flex-col gap-1">
        <SectionHeader
          title={t('home.waitingTitle', { count: waiting.length })}
          action={
            <SeeAllLink to="/invites" />
          }
        />
        <SwipeDeck<MeetupListItem>
          items={waiting}
          getKey={(m) => m.id}
          label={t('home.deckLabel')}
          actions={swipeActions}
          onSwipe={(m, dir) => actions.answer(m, SWIPE_TO_RESPONSE[dir])}
          onOpen={(m) => openInvite(m.id)}
          renderCard={(m) => (
            <InviteCard
              meetup={m}
              now={now}
              onOpen={() => openInvite(m.id)}
              onHide={canHide(m, me.data?.userId) ? () => actions.hide(m, true) : undefined}
            />
          )}
        />
        <p className="pt-1 text-center text-xs text-muted-foreground">{t('home.swipeHint')}</p>
      </section>
    ),

    agenda: (
      <section className="flex flex-col gap-1">
        <SectionHeader
          title={t('home.subtitle', { count: weekMeetups.length })}
          action={
            <SeeAllLink to="/calendar" label={t('calendar.open')} />
          }
        />
        <WeekStrip today={now} selected={selectedDay} onSelect={setSelectedDay} markedDays={weekMeetups.map((m) => new Date(m.startsAt))} />
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
        <SectionHeader title={t('home.pendingTitle', { count: home.pending.length })} action={home.pending.length > ROW_PREVIEW && <SeeAllLink to="/pending" />} />
        <HScroll label={t('home.pendingTitle', { count: home.pending.length })}>
          {home.pending.slice(0, ROW_PREVIEW).map((item) => {
            const Icon = PENDING_ICONS[item.kind]
            return (
              <div key={item.id} className="flex w-56 shrink-0 snap-start items-start gap-3 rounded-xl border bg-card p-3">
                <IconTile icon={Icon} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{pendingTitle(item)}</span>
                  <span className="line-clamp-2 text-xs text-muted-foreground">{pendingSubtitle(item, now)}</span>
                </span>
              </div>
            )
          })}
        </HScroll>
      </section>
    ),

    feed: home && home.feed.length > 0 && (
      <section>
        <SectionHeader title={t('home.friendsUpdates')} action={home.feed.length > ROW_PREVIEW && <SeeAllLink to="/updates" />} />
        <HScroll label={t('home.friendsUpdates')}>
          {home.feed.slice(0, ROW_PREVIEW).map((item) => (
            <div key={item.id} className="flex w-60 shrink-0 snap-start items-center gap-3 rounded-xl border bg-card p-3">
              <Avatar name={item.actorName} />
              <span className="min-w-0">
                <span className="line-clamp-2 text-sm">{feedText(item)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.gangName} · {formatTimeAgo(new Date(item.createdAt), now)}
                </span>
              </span>
            </div>
          ))}
        </HScroll>
      </section>
    ),

    highlights: <Highlights meetups={meetups} now={now} />,
    tools: <QuickTools />,
    missions: <DailyMissions petName={myPet ? t(`pet.species.${myPet.species}`) : t('home.yourPet')} />,
    discover: <DiscoverRow />,
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <HomeGreeting name={me.data?.displayName ?? null} species={myPet?.species ?? null} streak={streakOf(daily, now)} onPetTap={() => markDone('pet')} now={now} />

      {/* Order and visibility come from Settings → หน้าหลัก. */}
      {layout.order
        .filter((id) => !layout.hidden.includes(id))
        .map((id) => (
          <Fragment key={id}>{sections[id]}</Fragment>
        ))}

      {homeQuery.isError && <ErrorState onRetry={() => void homeQuery.refetch()} />}
    </div>
  )
}

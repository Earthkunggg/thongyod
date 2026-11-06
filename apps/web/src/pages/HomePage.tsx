import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useHome } from '@/api/home'
import { useMe } from '@/api/profile'
import { useMeetupsInRange } from '@/api/meetups'
import type { MeetupListItem } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SwipeDeck } from '@/components/common/SwipeDeck'
import { SeeAllLink } from '@/components/common/SeeAllLink'
import { PENDING_ICONS } from '@/config/pending'
import { DailyMissions } from '@/components/home/DailyMissions'
import { FeedRow } from '@/components/home/FeedRow'
import { HomeZone } from '@/components/home/HomeZone'
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
import { addDays, formatDayLabel, isSameDay, startOfWeek } from '@/lib/date'
import { pendingSubtitle, pendingTitle } from '@/lib/describe'

/** Lists on Home show this many rows; the rest are behind "ดูทั้งหมด". */
const ROW_PREVIEW = 3

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
  const petName = myPet ? t(`pet.species.${myPet.species}`) : t('home.yourPet')
  const pending = home?.pending ?? []
  const feed = home?.feed ?? []

  // Four zones (decision #83). Inside a zone: muted sub-headings, vertical lists (no sideways rows except the
  // swipe deck), at most ROW_PREVIEW rows with "ดูทั้งหมด".
  const sections: Record<HomeSectionId, ReactNode> = {
    today: (
      <HomeZone title={t('home.zones.today')} action={<SeeAllLink to="/calendar" label={t('calendar.open')} />}>
        {waiting.length > 0 && (
          <div className="flex flex-col gap-1">
            <SectionHeader muted title={t('home.waitingTitle', { count: waiting.length })} action={<SeeAllLink to="/invites" />} />
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
          </div>
        )}

        <div className="flex flex-col gap-1">
          <SectionHeader muted title={t('home.subtitle', { count: weekMeetups.length })} />
          <WeekStrip today={now} selected={selectedDay} onSelect={setSelectedDay} markedDays={weekMeetups.map((m) => new Date(m.startsAt))} />
          {meetupsQuery.isPending ? (
            <LoadingState rows={2} />
          ) : meetupsQuery.isError ? (
            <ErrorState onRetry={() => void meetupsQuery.refetch()} />
          ) : (
            <Card className="mx-3 mt-1 px-4 py-1">
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
        </div>

        {pending.length > 0 && (
          <div className="flex flex-col gap-1">
            <SectionHeader muted title={t('home.pendingTitle', { count: pending.length })} action={pending.length > ROW_PREVIEW && <SeeAllLink to="/pending" />} />
            <Card className="mx-3 px-4 py-1">
              {pending.slice(0, ROW_PREVIEW).map((item) => (
                <ListRow key={item.id} leading={<IconTile icon={PENDING_ICONS[item.kind]} />} title={pendingTitle(item)} subtitle={pendingSubtitle(item, now)} />
              ))}
            </Card>
          </div>
        )}
      </HomeZone>
    ),

    friends: (
      <HomeZone title={t('home.zones.friends')} action={feed.length > ROW_PREVIEW && <SeeAllLink to="/updates" />}>
        <Card className="mx-3 px-4 py-1">
          {homeQuery.isPending ? (
            <LoadingState rows={2} />
          ) : feed.length > 0 ? (
            feed.slice(0, ROW_PREVIEW).map((item) => <FeedRow key={item.id} item={item} now={now} />)
          ) : (
            <EmptyState title={t('home.feedEmpty')} />
          )}
        </Card>
      </HomeZone>
    ),

    pet: (
      <HomeZone title={t('home.zones.pet', { name: petName })} action={<SeeAllLink to="/pet" label={t('home.zones.petOpen')} />}>
        <DailyMissions petName={petName} />
      </HomeZone>
    ),

    tools: (
      <HomeZone title={t('home.zones.tools')}>
        <QuickTools />
      </HomeZone>
    ),
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
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

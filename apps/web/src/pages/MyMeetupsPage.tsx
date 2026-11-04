import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CalendarPlus } from 'lucide-react'
import { useMeetupsInRange } from '@/api/meetups'
import type { MeetupListItem } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { addDays, formatDayLabel, startOfDay } from '@/lib/date'

type View = 'upcoming' | 'past'
/** The API allows up to 93 days per request (DECISIONS #40). */
const DAYS = 60

// "นัดของฉัน": upcoming meetups, and past ones I went to (opened from the profile stats or the tools page).
export function MyMeetupsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const [view, setView] = useState<View>(params.get('view') === 'past' ? 'past' : 'upcoming')
  const range = useMemo(() => {
    const today = startOfDay(new Date())
    return view === 'upcoming'
      ? { from: today.toISOString(), to: addDays(today, DAYS).toISOString() }
      : { from: addDays(today, -DAYS).toISOString(), to: today.toISOString() }
  }, [view])
  const meetups = useMeetupsInRange(range.from, range.to)

  const days = useMemo(() => {
    const list = (meetups.data ?? []).filter((m) => (view === 'past' ? m.myResponse === 'going' : true))
    list.sort((a, b) => (view === 'past' ? b.startsAt.localeCompare(a.startsAt) : a.startsAt.localeCompare(b.startsAt)))
    const groups = new Map<string, MeetupListItem[]>()
    for (const m of list) {
      const key = startOfDay(new Date(m.startsAt)).toISOString()
      groups.set(key, [...(groups.get(key) ?? []), m])
    }
    return [...groups.entries()]
  }, [meetups.data, view])

  return (
    <>
      <PageHeader
        title={t('myMeetups.title')}
        backTo="/me"
        action={
          <Link to="/calendar" className={buttonVariants({ variant: 'ghost', size: 'icon' })} aria-label={t('calendar.open')}>
            <CalendarDays className="size-5" />
          </Link>
        }
      />
      <div className="flex flex-col gap-3 pb-8">
        <div className="px-4">
          <SegmentedChoice<View>
            label={t('myMeetups.title')}
            value={view}
            onChange={setView}
            options={[
              { value: 'upcoming', label: t('myMeetups.upcoming') },
              { value: 'past', label: t('myMeetups.past') },
            ]}
          />
        </div>
        {meetups.isPending ? (
          <LoadingState rows={4} />
        ) : meetups.isError ? (
          <ErrorState onRetry={() => void meetups.refetch()} />
        ) : days.length === 0 ? (
          <div className="px-4">
            <EmptyState
              title={view === 'upcoming' ? t('myMeetups.emptyUpcoming') : t('myMeetups.emptyPast')}
              action={
                view === 'upcoming' && (
                  <Link to="/meetups/new" className={buttonVariants()}>
                    <CalendarPlus data-icon="inline-start" />
                    {t('tools.createMeetup.title')}
                  </Link>
                )
              }
            />
          </div>
        ) : (
          days.map(([day, list]) => (
            <section key={day}>
              <SectionHeader title={formatDayLabel(new Date(day))} />
              <Card className="mx-3 px-4 py-1">
                {list.map((m) => (
                  <MeetupRow key={m.id} meetup={m} />
                ))}
              </Card>
            </section>
          ))
        )}
      </div>
    </>
  )
}

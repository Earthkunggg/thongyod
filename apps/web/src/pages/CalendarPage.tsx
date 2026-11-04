import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMeetupsInRange } from '@/api/meetups'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { MonthGrid, type DayMark } from '@/components/common/MonthGrid'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageHeader } from '@/components/layout/PageHeader'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { addMonths, dayKey, defaultDay, gridRange, groupByDay, monthKey, parseDayKey, parseMonthKey, startOfMonth } from '@/features/calendar/month'
import { isLocked } from '@/features/meetups/derive'
import { formatDayLabel, formatMonthYear, startOfDay } from '@/lib/date'

// /calendar?m=2026-11&d=2026-11-05 — full month with dots; tap a day to see its meetups.
// Month and day live in the URL (replace, not push), so back returns to where the user came from
// and reopening the page keeps the selection.
export function CalendarPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const today = useMemo(() => new Date(), [])
  const month = parseMonthKey(params.get('m')) ?? startOfMonth(today)

  const range = gridRange(month) // plain strings, so the query key is stable without memo
  const query = useMeetupsInRange(range.from, range.to)
  const meetups = useMemo(() => (query.data ?? []).filter((m) => !m.myState.hidden), [query.data])
  const byDay = useMemo(() => groupByDay(meetups), [meetups])

  const marks = useMemo(() => {
    const result = new Map<string, DayMark>()
    for (const [key, list] of byDay) {
      result.set(key, { count: list.length, needsAnswer: list.some((m) => m.myResponse === null && !isLocked(m, today)) })
    }
    return result
  }, [byDay, today])

  const pickedDay = parseDayKey(params.get('d'))
  const selected = pickedDay ?? defaultDay(month, today, byDay.keys())
  const dayItems = byDay.get(dayKey(selected)) ?? []
  const monthCount = meetups.filter((m) => monthKey(new Date(m.startsAt)) === monthKey(month)).length

  function go(nextMonth: Date, day?: Date) {
    const next = new URLSearchParams(params)
    next.set('m', monthKey(nextMonth))
    if (day) next.set('d', dayKey(day))
    else next.delete('d')
    setParams(next, { replace: true })
  }
  function selectDay(day: Date) {
    // Tapping a grey day from the next/previous month also moves to that month.
    go(startOfMonth(day), day)
  }
  const isThisMonth = monthKey(month) === monthKey(today)
  const canInvite = startOfDay(selected) >= startOfDay(today)

  return (
    <>
      <PageHeader
        title={t('calendar.title')}
        backTo="/"
        action={
          !isThisMonth || (pickedDay && dayKey(pickedDay) !== dayKey(today)) ? (
            <Button variant="outline" size="sm" onClick={() => go(startOfMonth(today), today)}>
              {t('time.today')}
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-2 pb-8">
        <div className="flex items-center justify-between px-2">
          <Button variant="ghost" size="icon" aria-label={t('calendar.prevMonth')} onClick={() => go(addMonths(month, -1))}>
            <ChevronLeft className="size-5" />
          </Button>
          <div className="text-center" aria-live="polite">
            <p className="font-medium">{formatMonthYear(month)}</p>
            <p className="text-xs text-muted-foreground">
              {query.isPending ? ' ' : t('calendar.monthCount', { count: monthCount })}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label={t('calendar.nextMonth')} onClick={() => go(addMonths(month, 1))}>
            <ChevronRight className="size-5" />
          </Button>
        </div>

        <MonthGrid month={month} today={today} selected={selected} onSelect={selectDay} marks={marks} onSwipeMonth={(delta) => go(addMonths(month, delta))} />

        <section>
          <SectionHeader
            title={t('home.agendaTitle', { day: formatDayLabel(selected, today) })}
            action={
              canInvite && (
                <Link to={`/meetups/new?date=${dayKey(selected)}`} className="flex items-center gap-1 text-xs font-medium text-primary">
                  <CalendarPlus className="size-3.5" aria-hidden="true" />
                  {t('calendar.inviteOnDay', { day: formatDayLabel(selected, today) })}
                </Link>
              )
            }
          />
          {query.isPending ? (
            <LoadingState rows={2} />
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : (
            <Card className="mx-3 px-4 py-1">
              {dayItems.length > 0 ? (
                dayItems.map((m) => <MeetupRow key={m.id} meetup={m} />)
              ) : (
                <EmptyState
                  title={t('home.noMeetupOnDay', { day: formatDayLabel(selected, today) })}
                  action={
                    canInvite && (
                      <Link to={`/meetups/new?date=${dayKey(selected)}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                        <CalendarPlus data-icon="inline-start" />
                        {t('tools.createMeetup.title')}
                      </Link>
                    )
                  }
                />
              )}
            </Card>
          )}
        </section>
      </div>
    </>
  )
}

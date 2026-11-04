import { useRef, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { dayKey, monthGrid } from '@/features/calendar/month'
import { formatFullDay, isSameDay } from '@/lib/date'
import { cn } from '@/lib/utils'

/** What a day has on it: number of items, and whether any still needs my answer. */
export type DayMark = { count: number; needsAnswer: boolean }

type MonthGridProps = {
  /** Any date inside the month to show. */
  month: Date
  today: Date
  selected: Date
  onSelect: (day: Date) => void
  /** Day key ("2026-11-05") → mark. Days without an entry show no dots. */
  marks: Map<string, DayMark>
  /** Swipe left/right on the grid (a shortcut; the page must also have ‹ › buttons). */
  onSwipeMonth?: (delta: 1 | -1) => void
}

const MAX_DOTS = 3
const SWIPE_MIN_PX = 50

// Full month, Monday first (same as WeekStrip). Today is filled, the selected day has a ring,
// dots = items (max 3); the first dot is hollow when something still needs my answer.
export function MonthGrid({ month, today, selected, onSelect, marks, onSwipeMonth }: MonthGridProps) {
  const { t } = useTranslation()
  const start = useRef<{ x: number; y: number } | null>(null)
  const names = t('time.weekdaysShort').split(',') // Sunday first
  const header = [...names.slice(1), names[0]]

  function onPointerDown(event: PointerEvent) {
    start.current = { x: event.clientX, y: event.clientY }
  }
  function onPointerUp(event: PointerEvent) {
    const from = start.current
    start.current = null
    if (!from || !onSwipeMonth) return
    const dx = event.clientX - from.x
    const dy = event.clientY - from.y
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipeMonth(dx < 0 ? 1 : -1)
  }

  return (
    <div
      className="touch-pan-y px-3 select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (start.current = null)}
    >
      <div className="grid grid-cols-7 pb-1 text-center text-xs text-muted-foreground" aria-hidden="true">
        {header.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div key={dayKey(month)} className="grid grid-cols-7 gap-y-1 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200" role="group" aria-label={t('calendar.gridLabel')}>
        {monthGrid(month).map((day) => {
          const inMonth = day.getMonth() === month.getMonth()
          const isToday = isSameDay(day, today)
          const isSelected = isSameDay(day, selected)
          const mark = marks.get(dayKey(day))
          const dots = mark ? Math.min(mark.count, MAX_DOTS) : 0
          return (
            <button
              key={dayKey(day)}
              type="button"
              onClick={() => onSelect(day)}
              aria-pressed={isSelected}
              aria-label={[
                formatFullDay(day),
                isToday ? t('time.todaySuffix') : '',
                mark ? t('calendar.dayCount', { count: mark.count }) : '',
                mark?.needsAnswer ? t('calendar.needsAnswer') : '',
              ].join('')}
              className={cn(
                'mx-auto flex h-12 w-11 flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-colors',
                isToday ? 'bg-primary font-medium text-primary-foreground' : 'active:bg-muted',
                !isToday && !inMonth && 'text-muted-foreground/60',
                isSelected && !isToday && 'ring-2 ring-primary ring-inset',
              )}
            >
              <span className="leading-none tabular-nums">{day.getDate()}</span>
              <span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">
                {Array.from({ length: dots }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'size-1.5 rounded-full',
                      // Hollow = still waiting for my answer; filled = answered (works in every theme and mode).
                      i === 0 && mark?.needsAnswer
                        ? cn('border', isToday ? 'border-primary-foreground' : 'border-primary')
                        : isToday
                          ? 'bg-primary-foreground'
                          : 'bg-primary',
                      !inMonth && 'opacity-50',
                    )}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>
      <p className="flex justify-center gap-4 pt-2 text-xs text-muted-foreground" aria-hidden="true">
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary" />
          {t('calendar.legendMeetup')}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full border border-primary" />
          {t('calendar.legendWaiting')}
        </span>
      </p>
    </div>
  )
}

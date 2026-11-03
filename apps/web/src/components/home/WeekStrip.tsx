import { useTranslation } from 'react-i18next'
import { formatFullDay, isSameDay, weekDays, weekdayShort } from '@/lib/date'
import { cn } from '@/lib/utils'

type WeekStripProps = {
  today: Date
  selected: Date
  onSelect: (day: Date) => void
  /** Days that have something on them (shown as a dot). */
  markedDays: Date[]
}

// Mon-Sun of the current week. Today is filled; the selected day has a ring.
export function WeekStrip({ today, selected, onSelect, markedDays }: WeekStripProps) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-7 gap-1 px-3" role="group" aria-label={t('home.thisWeek')}>
      {weekDays(today).map((day) => {
        const isToday = isSameDay(day, today)
        const isSelected = isSameDay(day, selected)
        const hasMark = markedDays.some((d) => isSameDay(d, day))
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onSelect(day)}
            aria-pressed={isSelected}
            aria-label={`${formatFullDay(day)}${isToday ? t('time.todaySuffix') : ''}${hasMark ? t('home.hasMeetup') : ''}`}
            className={cn(
              'flex min-h-16 flex-col items-center justify-start rounded-lg pt-1.5 text-xs transition-colors',
              isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground active:bg-muted',
              isSelected && !isToday && 'ring-2 ring-primary ring-inset',
            )}
          >
            <span>{weekdayShort(day)}</span>
            <span className={cn('text-base font-medium', !isToday && 'text-foreground')}>
              {day.getDate()}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 size-1.5 rounded-full',
                hasMark ? (isToday ? 'bg-primary-foreground' : 'bg-primary') : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

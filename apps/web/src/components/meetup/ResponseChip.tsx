import { useTranslation } from 'react-i18next'
import type { MeetupResponse } from '@thongyod/shared'
import { cn } from '@/lib/utils'

const LABEL = {
  going: 'meetup.going',
  maybe: 'meetup.maybe',
  not_going: 'meetup.notGoing',
} as const satisfies Record<MeetupResponse, string>

// Small label with my answer (ไป / อาจจะ / ไม่ไป / ยังไม่ตอบ).
export function ResponseChip({ response }: { response: MeetupResponse | null }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-2 py-0.5 text-xs font-medium',
        response === 'going' && 'bg-primary text-primary-foreground',
        response === 'maybe' && 'bg-accent text-accent-foreground',
        (response === 'not_going' || response === null) && 'bg-muted text-muted-foreground',
      )}
    >
      {response ? t(LABEL[response]) : t('meetup.notAnswered')}
    </span>
  )
}

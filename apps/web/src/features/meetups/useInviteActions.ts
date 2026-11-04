import { useTranslation } from 'react-i18next'
import { Check, HelpCircle, X } from 'lucide-react'
import type { MeetupResponse } from '@thongyod/shared'
import type { SwipeAction, SwipeDir } from '@/components/common/SwipeDeck'

/** right = ไป, left = ไม่ไป, up = อาจจะ (DECISIONS #46). */
export const SWIPE_TO_RESPONSE: Record<SwipeDir, MeetupResponse> = { right: 'going', left: 'not_going', up: 'maybe' }

/** The 3 answer buttons/stamps used by every invite deck and the invite detail page. */
export function useInviteActions(): SwipeAction[] {
  const { t } = useTranslation()
  return [
    { dir: 'left', label: t('meetup.notGoing'), icon: X, tone: 'border-muted-foreground/40 text-muted-foreground' },
    { dir: 'up', label: t('meetup.maybe'), icon: HelpCircle, tone: 'border-tone-warning-foreground text-tone-warning-foreground' },
    { dir: 'right', label: t('meetup.going'), icon: Check, tone: 'border-primary text-primary' },
  ]
}

import { useTranslation } from 'react-i18next'
import { Check, Clock, UserPlus } from 'lucide-react'
import type { UserCard } from '@/api/types'
import { Button } from '@/components/ui/button'
import { useFriendActions } from '@/features/friends/useFriendActions'

// The one button next to a person, depending on how we are related.
export function FriendActionButton({ user }: { user: UserCard }) {
  const { t } = useTranslation()
  const actions = useFriendActions()

  switch (user.relationship) {
    case 'self':
      return <span className="text-xs text-muted-foreground">{t('friends.you')}</span>
    case 'friend':
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Check className="size-4" aria-hidden="true" />
          {t('friends.alreadyFriends')}
        </span>
      )
    case 'request_sent':
      return (
        <Button variant="outline" size="sm" disabled={actions.isBusy} onClick={() => actions.cancel(user.requestId!)}>
          <Clock aria-hidden="true" />
          {t('friends.requestSent')}
        </Button>
      )
    case 'request_received':
      return (
        <Button size="sm" disabled={actions.isBusy} onClick={() => actions.accept(user.requestId!, user)}>
          {t('friends.accept')}
        </Button>
      )
    case 'none':
      return (
        <Button size="sm" disabled={actions.isBusy} onClick={() => actions.add(user)}>
          <UserPlus aria-hidden="true" />
          {t('friends.add')}
        </Button>
      )
  }
}

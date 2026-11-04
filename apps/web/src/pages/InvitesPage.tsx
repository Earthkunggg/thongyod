import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/api/profile'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { SwipeDeck } from '@/components/common/SwipeDeck'
import { PageHeader } from '@/components/layout/PageHeader'
import { InviteCard } from '@/components/meetup/InviteCard'
import { buttonVariants } from '@/components/ui/button'
import { canHide } from '@/features/meetups/derive'
import { SWIPE_TO_RESPONSE, useInviteActions } from '@/features/meetups/useInviteActions'
import { useMeetupActions } from '@/features/meetups/useMeetupActions'
import { useWaitingMeetups } from '@/features/meetups/useWaiting'

// /invites — every invite waiting for me, as a full-page Tinder-style deck (DECISIONS #57).
export function InvitesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, query, now } = useWaitingMeetups()
  const actions = useMeetupActions()
  const swipeActions = useInviteActions()
  const me = useMe()
  const open = (id: string) => void navigate(`/meetups/${id}?invite=1`)

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={t('home.waitingTitle', { count: items.length })} subtitle={items.length > 0 ? t('home.swipeHint') : undefined} backTo="/" />
      {query.isPending ? (
        <LoadingState rows={3} />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <div className="px-4">
          <EmptyState
            title={t('invites.allDone')}
            hint={t('invites.allDoneHint')}
            action={
              <Link to="/meetups" className={buttonVariants({ variant: 'outline' })}>
                {t('myMeetups.title')}
              </Link>
            }
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center pb-8">
          <SwipeDeck
            tall
            items={items}
            getKey={(m) => m.id}
            label={t('home.deckLabel')}
            actions={swipeActions}
            onSwipe={(m, dir) => actions.answer(m, SWIPE_TO_RESPONSE[dir])}
            onOpen={(m) => open(m.id)}
            renderCard={(m) => (
              <InviteCard
                tall
                meetup={m}
                now={now}
                onOpen={() => open(m.id)}
                onHide={canHide(m, me.data?.userId) ? () => actions.hide(m, true) : undefined}
              />
            )}
          />
        </div>
      )}
    </div>
  )
}

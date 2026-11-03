import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarDays, Clock, EyeOff, Users } from 'lucide-react'
import type { MeetupResponse } from '@thongyod/shared'
import { ApiError } from '@/api/client'
import { useMeetup } from '@/api/meetups'
import { useMe } from '@/api/profile'
import type { MeetupMember } from '@thongyod/shared'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageHeader } from '@/components/layout/PageHeader'
import { HideMeetupButton } from '@/components/meetup/HideMeetupButton'
import { ResponsePicker } from '@/components/meetup/ResponsePicker'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { canHide, isLocked } from '@/features/meetups/derive'
import { useMeetupActions } from '@/features/meetups/useMeetupActions'
import { formatDayLabel, formatFullDay, formatTime, formatTimeUntil } from '@/lib/date'

type GroupKey = MeetupResponse | 'none'
const GROUPS: { key: GroupKey; label: 'meetup.going' | 'meetup.maybe' | 'meetup.notGoing' | 'meetup.notAnswered' }[] = [
  { key: 'going', label: 'meetup.going' },
  { key: 'maybe', label: 'meetup.maybe' },
  { key: 'not_going', label: 'meetup.notGoing' },
  { key: 'none', label: 'meetup.notAnswered' },
]

// /meetups/:id — meetup info, my answer (editable until locked), and who answered what.
export function MeetupDetailPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const query = useMeetup(id)
  const actions = useMeetupActions()
  const me = useMe()
  const now = new Date()

  if (query.isPending) {
    return (
      <>
        <PageHeader title={t('common.loading')} backTo="/" />
        <LoadingState rows={4} />
      </>
    )
  }

  if (query.isError) {
    const notFound = query.error instanceof ApiError && query.error.status === 404
    return (
      <>
        <PageHeader title={notFound ? t('meetup.notFound') : t('common.loadError')} backTo="/" />
        {notFound ? (
          <EmptyState title={t('meetup.notFoundHint')} />
        ) : (
          <ErrorState onRetry={() => void query.refetch()} />
        )}
      </>
    )
  }

  const meetup = query.data
  const startsAt = new Date(meetup.startsAt)
  const lockAt = new Date(meetup.responseLocksAt)
  const locked = isLocked(meetup, now)
  const myId = me.data?.userId
  const isMe = (m: MeetupMember) => !m.isGuest && m.userId === myId
  const hidden = meetup.myState.hidden
  const countdown = formatTimeUntil(startsAt, now)
  // Hidden people are in no group, including me when I hid it (decision #32).
  const listed = meetup.members.filter((m) => !(isMe(m) && hidden))
  const groupOf = (m: MeetupMember): GroupKey => m.response ?? 'none'

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PageHeader title={meetup.title} subtitle={meetup.gangName} backTo="/" />

      <Card className="mx-3 flex flex-col gap-2 p-4 text-sm">
        <p className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
          {formatFullDay(startsAt)}
        </p>
        <p className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
          {formatTime(startsAt)}
          {countdown && (
            <span className="rounded-md bg-accent px-2 text-xs font-medium text-accent-foreground">{countdown}</span>
          )}
        </p>
        <p className="flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" aria-hidden="true" />
          {t('meetup.createdBy', { name: meetup.createdBy.displayName })}
        </p>
      </Card>

      <section>
        <SectionHeader title={t('meetup.myAnswer')} />
        <Card className="mx-3 p-4">
          {hidden ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <EyeOff className="size-5 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t('meetup.hiddenNotice')}</p>
              {locked ? (
                <p className="text-xs text-muted-foreground">{t('meetup.locked')}</p>
              ) : (
                <Button variant="outline" size="sm" onClick={() => actions.hide(meetup, false)}>
                  {t('meetup.unhide')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <ResponsePicker
                value={meetup.myResponse}
                onChange={(r) => actions.answer(meetup, r)}
                label={meetup.title}
                disabled={locked}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {locked
                  ? t('meetup.locked')
                  : t('meetup.editableUntil', { when: `${formatDayLabel(lockAt, now)} ${formatTime(lockAt)}` })}
              </p>
              {canHide(meetup, myId) && !locked && (
                <div className="-mb-2 flex justify-center">
                  <HideMeetupButton onClick={() => actions.hide(meetup, true)} />
                </div>
              )}
            </>
          )}
        </Card>
      </section>

      <section>
        <SectionHeader title={t('meetup.members')} />
        <div className="flex flex-col gap-3">
          {GROUPS.map(({ key, label }) => {
            const people = listed.filter((m) => groupOf(m) === key)
            if (people.length === 0) return null
            return (
              <Card key={key} className="mx-3 px-4 py-1">
                <h3 className="pt-2 text-xs font-medium text-muted-foreground">
                  {t('meetup.groupCount', { label: t(label), count: people.length })}
                </h3>
                {people.map((p) => (
                  <ListRow
                    key={p.participantId}
                    leading={<Avatar name={p.displayName} />}
                    title={`${p.displayName}${isMe(p) ? t('meetup.youSuffix') : ''}`}
                    subtitle={p.isGuest ? t('meetup.guest') : undefined}
                  />
                ))}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}

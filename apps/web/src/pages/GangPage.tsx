import { Link, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Award, CalendarPlus } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useGang } from '@/api/gangs'
import { useMe } from '@/api/profile'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { HScroll } from '@/components/common/HScroll'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SeeAllLink } from '@/components/common/SeeAllLink'
import { GangAvatar } from '@/components/gang/GangAvatar'
import { PageHeader } from '@/components/layout/PageHeader'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatMonthYear } from '@/lib/date'
import { profileLink } from '@/lib/nav'
import { cn } from '@/lib/utils'

/** Members shown in the sideways row; the rest are on /gangs/:id/members. */
const MEMBER_PREVIEW = 10

// /gangs/:gangId — one gang: members, upcoming meetups, titles earned here. Main action: ชวนนัดแก๊งนี้.
// Visible to members only (404 otherwise). No leader, no admin buttons (#31).
export function GangPage() {
  const { t } = useTranslation()
  const { gangId = '' } = useParams()
  const gang = useGang(gangId)
  const me = useMe()
  const notFound = gang.error instanceof ApiError && gang.error.status === 404
  const g = gang.data

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={g?.name ?? t('gang.title')} subtitle={g ? t('gang.memberCount', { count: g.memberCount }) : undefined} backTo="/gangs" />
      {gang.isPending ? (
        <LoadingState rows={4} />
      ) : notFound ? (
        <EmptyState title={t('gang.notFound')} hint={t('gang.notFoundHint')} />
      ) : gang.isError || !g ? (
        <ErrorState onRetry={() => void gang.refetch()} />
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-4 pb-6">
            <div className="flex justify-center pt-1">
              <GangAvatar id={g.id} name={g.name} className="size-16 rounded-2xl text-2xl" />
            </div>

            <section>
              <SectionHeader
                title={t('gang.members', { count: g.memberCount })}
                action={g.members.length > MEMBER_PREVIEW && <SeeAllLink to={`/gangs/${g.id}/members`} />}
              />
              <HScroll label={t('gang.members', { count: g.memberCount })}>
                {g.members.slice(0, MEMBER_PREVIEW).map((m) => (
                  <Link key={m.userId} to={profileLink(m.userId, me.data?.userId)} className="flex w-16 shrink-0 snap-start flex-col items-center gap-1 active:opacity-70">
                    <Avatar name={m.displayName} src={m.avatarUrl} className="size-12 text-base" />
                    <span className="w-full truncate text-center text-xs">{m.userId === me.data?.userId ? t('gang.you') : m.displayName}</span>
                  </Link>
                ))}
              </HScroll>
            </section>

            <section>
              <SectionHeader title={t('gang.upcoming')} />
              <Card className="mx-3 px-4 py-1">
                {g.upcoming.length > 0 ? (
                  g.upcoming.map((m) => <MeetupRow key={m.id} meetup={m} showDay />)
                ) : (
                  <EmptyState title={t('gang.noUpcoming')} hint={t('gang.noUpcomingHint')} />
                )}
              </Card>
            </section>

            <section>
              <SectionHeader title={t('gang.titles', { count: g.titles.length })} />
              <Card className="mx-3 px-4 py-1">
                {g.titles.length > 0 ? (
                  g.titles.map((x) => (
                    <ListRow
                      key={x.id}
                      leading={<IconTile icon={Award} />}
                      title={x.name}
                      subtitle={`${x.holder.displayName} · ${t('profile.earnedOn', { date: formatMonthYear(new Date(x.earnedAt)) })}`}
                      to={profileLink(x.holder.userId, me.data?.userId)}
                    />
                  ))
                ) : (
                  <EmptyState title={t('gang.noTitles')} hint={t('gang.noTitlesHint')} />
                )}
              </Card>
            </section>
          </div>

          {/* One hero action in the thumb zone (UX §1.2). */}
          <div className="sticky bottom-0 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
            <Link to={`/meetups/new?gang=${g.id}`} className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              <CalendarPlus data-icon="inline-start" />
              {t('gang.invite')}
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

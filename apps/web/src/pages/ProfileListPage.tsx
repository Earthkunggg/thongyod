import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Award, Users } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useProfile } from '@/api/profile'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { formatMonthYear } from '@/lib/date'

type ListKind = 'titles' | 'gangs'

// /u/:userId/titles and /u/:userId/gangs — the full lists behind "ดูทั้งหมด" on a profile.
// Same data and privacy as the profile (#44): titles only for friends/self, gangs only the ones we share.
export function ProfileListPage({ kind }: { kind: ListKind }) {
  const { t } = useTranslation()
  const { userId = '' } = useParams()
  const profile = useProfile(userId)
  const notFound = profile.error instanceof ApiError && profile.error.status === 404
  const p = profile.data
  const title = kind === 'titles' ? t('profile.titlesPage') : t('profile.sharedGangsPage')

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader title={title} subtitle={p?.displayName} backTo={`/u/${userId}`} />
      {profile.isPending ? (
        <LoadingState rows={4} />
      ) : notFound ? (
        <EmptyState title={t('profile.notFound')} />
      ) : profile.isError || !p ? (
        <ErrorState onRetry={() => void profile.refetch()} />
      ) : (
        <Card className="mx-3 px-4 py-1">
          {kind === 'titles' ? (
            (p.titles ?? []).length === 0 ? (
              <EmptyState title={t('profile.noTitles')} />
            ) : (
              p.titles!.map((x) => (
                <ListRow
                  key={x.id}
                  leading={<IconTile icon={Award} />}
                  title={x.name}
                  subtitle={[x.gangName, t('profile.earnedOn', { date: formatMonthYear(new Date(x.earnedAt)) })].filter(Boolean).join(' · ')}
                />
              ))
            )
          ) : p.sharedGangs.length === 0 ? (
            <EmptyState title={t('profile.noSharedGangs')} />
          ) : (
            p.sharedGangs.map((g) => <ListRow key={g.id} leading={<IconTile icon={Users} tone="neutral" />} title={g.name} to={`/gangs/${g.id}`} />)
          )}
        </Card>
      )}
    </div>
  )
}

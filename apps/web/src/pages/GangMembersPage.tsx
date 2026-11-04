import { useState } from 'react'
import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { useGang } from '@/api/gangs'
import { useMe } from '@/api/profile'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SearchInput } from '@/components/common/SearchInput'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { useFriendSubtitle } from '@/features/friends/useFriendSubtitle'
import { profileLink } from '@/lib/nav'

// /gangs/:gangId/members — every member (max 50, spec §16), filtered on the phone by name or @handle.
export function GangMembersPage() {
  const { t } = useTranslation()
  const { gangId = '' } = useParams()
  const gang = useGang(gangId)
  const me = useMe()
  const subtitle = useFriendSubtitle()
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase().replace(/^@/, '')
  const members = (gang.data?.members ?? []).filter(
    (m) => needle === '' || m.displayName.toLowerCase().includes(needle) || m.handle.includes(needle),
  )

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader title={t('gang.membersPage')} subtitle={gang.data?.name} backTo={`/gangs/${gangId}`} />
      {gang.isPending ? (
        <LoadingState rows={5} />
      ) : gang.error instanceof ApiError && gang.error.status === 404 ? (
        <EmptyState title={t('gang.notFound')} hint={t('gang.notFoundHint')} />
      ) : gang.isError ? (
        <ErrorState onRetry={() => void gang.refetch()} />
      ) : (
        <>
          <div className="px-3">
            <SearchInput value={query} onChange={setQuery} placeholder={t('gang.memberFilterPlaceholder')} label={t('gang.memberFilterLabel')} />
          </div>
          <Card className="mx-3 px-4 py-1">
            {members.length === 0 ? (
              <EmptyState title={t('gang.noMemberMatch', { q: query.trim() })} />
            ) : (
              members.map((m) => (
                <ListRow
                  key={m.userId}
                  leading={<Avatar name={m.displayName} src={m.avatarUrl} />}
                  title={m.userId === me.data?.userId ? `${m.displayName} (${t('gang.you')})` : m.displayName}
                  subtitle={subtitle(m.handle, m.title)}
                  to={profileLink(m.userId, me.data?.userId)}
                />
              ))
            )}
          </Card>
        </>
      )}
    </div>
  )
}

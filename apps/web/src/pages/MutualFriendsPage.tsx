import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useMutualFriends } from '@/api/friends'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { InfiniteList } from '@/components/common/InfiniteList'
import { ListRow } from '@/components/common/ListRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { useFriendSubtitle } from '@/features/friends/useFriendSubtitle'

// /u/:userId/mutual — friends we have in common (paged). Never their full friend list (#44).
export function MutualFriendsPage() {
  const { t } = useTranslation()
  const { userId = '' } = useParams()
  const list = useMutualFriends(userId)
  const subtitle = useFriendSubtitle()

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PageHeader title={t('profile.mutualPage')} backTo={`/u/${userId}`} />
      <InfiniteList
        query={list}
        getKey={(p) => p.userId}
        renderItem={(p) => (
          <ListRow leading={<Avatar name={p.displayName} src={p.avatarUrl} />} title={p.displayName} subtitle={subtitle(p.handle, null)} to={`/u/${p.userId}`} />
        )}
        empty={<EmptyState title={t('profile.noMutual')} />}
      />
    </div>
  )
}

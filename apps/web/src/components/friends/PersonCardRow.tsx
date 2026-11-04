import type { UserCard } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { ListRow } from '@/components/common/ListRow'
import { useFriendSubtitle } from '@/features/friends/useFriendSubtitle'
import { FriendActionButton } from './FriendActionButton'

// A person from search or a friend link: tap the name for the profile, plus the right action button.
export function PersonCardRow({ user }: { user: UserCard }) {
  const subtitle = useFriendSubtitle()
  return (
    <ListRow
      leading={<Avatar name={user.displayName} src={user.avatarUrl} />}
      title={user.displayName}
      subtitle={subtitle(user.handle, user.title, user.mutualFriends)}
      to={user.relationship === 'self' ? '/me' : `/u/${user.userId}`}
      trailing={<FriendActionButton user={user} />}
    />
  )
}

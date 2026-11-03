import type { UserCard } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { ListRow } from '@/components/common/ListRow'
import { useFriendSubtitle } from '@/features/friends/useFriendSubtitle'
import { FriendActionButton } from './FriendActionButton'

// A person from search or a friend link, with the right action button.
export function PersonCardRow({ user }: { user: UserCard }) {
  const subtitle = useFriendSubtitle()
  return (
    <ListRow
      leading={<Avatar name={user.displayName} />}
      title={user.displayName}
      subtitle={subtitle(user.title, user.mutualFriends)}
      trailing={<FriendActionButton user={user} />}
    />
  )
}

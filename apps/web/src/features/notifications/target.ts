import type { AppNotification } from '@/api/types'

/** Where a notification opens. null = stay (e.g. a cancelled meetup has nothing to open). */
export function targetPath(item: AppNotification): string | null {
  const target = item.target
  if (!target) return null
  switch (target.type) {
    case 'meetup':
      return `/meetups/${target.id}`
    case 'user':
      return `/u/${target.id}`
    case 'gang':
      return `/gangs/${target.id}`
    case 'friend_requests':
      return '/gangs/friends'
    case 'room':
      return `/games/rooms/${target.id}`
  }
}

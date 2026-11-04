import type { FeedItem } from '@thongyod/shared'
import { Avatar } from '@/components/common/Avatar'
import { formatTimeAgo } from '@/lib/date'
import { feedText } from '@/lib/describe'

// One friends' update in a vertical list (/updates): avatar, sentence (2 lines max), gang · time ago.
// Not a link yet: feed items carry no target ids (requested from the backend in HANDOFF).
export function FeedRow({ item, now }: { item: FeedItem; now: Date }) {
  return (
    <div className="flex min-h-14 items-center gap-3 py-2 [&+&]:border-t">
      <Avatar name={item.actorName} />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-sm">{feedText(item)}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {item.gangName} · {formatTimeAgo(new Date(item.createdAt), now)}
        </span>
      </span>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Send } from 'lucide-react'
import { useFriendList } from '@/api/friends'
import { useInviteToRoom } from '@/api/rooms'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingState } from '@/components/common/LoadingState'
import { SearchInput } from '@/components/common/SearchInput'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { useDebouncedValue } from '@/lib/useDebouncedValue'
import { showErrorToast, toastManager } from '@/lib/toast'
import { cn } from '@/lib/utils'

type Props = { code: string; open: boolean; onOpenChange: (open: boolean) => void; exclude: string[] }

// Pick friends to invite; they get a "ชวนเล่น" notification that opens the room.
export function InviteFriendsSheet({ code, open, onOpenChange, exclude }: Props) {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const query = useDebouncedValue(q, 250)
  const list = useFriendList(query)
  const invite = useInviteToRoom(code)
  const [picked, setPicked] = useState<string[]>([])
  const friends = (list.data?.pages.flatMap((p) => p.items) ?? []).filter((f) => !exclude.includes(f.userId))

  function send() {
    invite.mutate(picked, {
      onSuccess: () => {
        toastManager.add({ title: t('rooms.invited', { count: picked.length }) })
        setPicked([])
        onOpenChange(false)
      },
      onError: () => showErrorToast(t('common.saveError')),
    })
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('rooms.inviteFriends')}
      footer={
        <Button size="lg" className="w-full" disabled={!picked.length || invite.isPending} onClick={send}>
          <Send data-icon="inline-start" />
          {picked.length ? t('rooms.sendInvites', { count: picked.length }) : t('rooms.pickFriends')}
        </Button>
      }
    >
      <div className="px-4 pb-2">
        <SearchInput value={q} onChange={setQ} placeholder={t('rooms.searchFriends')} label={t('rooms.searchFriends')} />
      </div>
      {list.isPending ? (
        <LoadingState rows={4} />
      ) : !friends.length ? (
        <EmptyState title={t('rooms.noFriends')} />
      ) : (
        <ul className="divide-y px-4" role="group" aria-label={t('rooms.inviteFriends')}>
          {friends.map((f) => {
            const on = picked.includes(f.userId)
            return (
              <li key={f.userId}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => setPicked((p) => (on ? p.filter((x) => x !== f.userId) : [...p, f.userId]))}
                  className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                >
                  <Avatar name={f.displayName} src={f.avatarUrl} className="size-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{f.displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">@{f.handle}</span>
                  </span>
                  <span className={cn('grid size-6 place-items-center rounded-full border-2', on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
                    {on && <Check className="size-4" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </BottomSheet>
  )
}

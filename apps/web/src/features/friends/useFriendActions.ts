// Friend actions with the shared behavior: toast on success, readable error toast on failure.
// Use this everywhere a friend request is sent, accepted, declined or canceled.
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { useAcceptFriendRequest, useDeleteFriendRequest, useSendFriendRequest } from '@/api/friends'
import type { PersonRef } from '@/api/types'
import { showErrorToast, showUndoToast, toastManager } from '@/lib/toast'

export function useFriendActions() {
  const { t } = useTranslation()
  const send = useSendFriendRequest()
  const accept = useAcceptFriendRequest()
  const remove = useDeleteFriendRequest()

  function onError(error: unknown) {
    showErrorToast(
      error instanceof ApiError && error.code === 'DAILY_LIMIT_REACHED' ? t('friends.errors.dailyLimit') : t('common.saveError'),
    )
  }

  return {
    /** Send a request. The undo button cancels it. */
    add(user: PersonRef) {
      send.mutate(user.userId, {
        onSuccess: (request) =>
          showUndoToast({
            title: t('friends.toast.sent', { name: user.displayName }),
            onUndo: () => remove.mutate(request.id, { onError }),
          }),
        onError,
      })
    },
    accept(requestId: string, user: PersonRef) {
      accept.mutate(requestId, {
        onSuccess: () => toastManager.add({ title: t('friends.toast.accepted', { name: user.displayName }) }),
        onError,
      })
    },
    /** Decline a received request. The sender is not told. */
    decline(requestId: string) {
      remove.mutate(requestId, { onSuccess: () => toastManager.add({ title: t('friends.toast.declined') }), onError })
    },
    cancel(requestId: string) {
      remove.mutate(requestId, { onSuccess: () => toastManager.add({ title: t('friends.toast.canceled') }), onError })
    },
    isBusy: send.isPending || accept.isPending || remove.isPending,
  }
}

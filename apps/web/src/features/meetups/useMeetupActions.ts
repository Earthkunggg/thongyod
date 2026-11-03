// Answer / hide a meetup with the shared behavior: optimistic change, "ย้อนกลับ" toast,
// and an error toast on failure. Use this everywhere a meetup can be answered or hidden.
import { useTranslation } from 'react-i18next'
import type { MeetupResponse } from '@thongyod/shared'
import { ApiError } from '@/api/client'
import { useSetMeetupHidden, useSetMeetupResponse, type MeetupRef } from '@/api/meetups'
import { showErrorToast, showUndoToast } from '@/lib/toast'

const RESPONSE_LABEL = {
  going: 'meetup.going',
  maybe: 'meetup.maybe',
  not_going: 'meetup.notGoing',
} as const satisfies Record<MeetupResponse, string>

export function useMeetupActions() {
  const { t } = useTranslation()
  const setResponse = useSetMeetupResponse()
  const setHidden = useSetMeetupHidden()

  function onError(error: unknown) {
    const code = error instanceof ApiError ? error.code : undefined
    showErrorToast(
      code === 'RESPONSE_LOCKED'
        ? t('meetup.locked')
        : code === 'MEETUP_VERSION_CONFLICT'
          ? t('meetup.versionConflict')
          : t('common.saveError'),
    )
  }

  /** Change my answer. Shows an undo bar that restores the previous answer. */
  function answer(meetup: MeetupRef, response: MeetupResponse) {
    if (meetup.myResponse === response) return
    const previous = meetup.myResponse
    setResponse.mutate(
      { meetup, response },
      {
        onSuccess: () =>
          showUndoToast({
            title: t('meetup.answered', { response: t(RESPONSE_LABEL[response]) }),
            description: meetup.title,
            // Undo uses the same schedule version; the server rejects it if the meetup changed meanwhile.
            onUndo: () => setResponse.mutate({ meetup: { ...meetup, myResponse: response }, response: previous }, { onError }),
          }),
        onError,
      },
    )
  }

  /** Hide or unhide for myself. Hiding shows an undo bar. */
  function hide(meetup: MeetupRef, hidden: boolean) {
    setHidden.mutate(
      { meetup, hidden },
      {
        onSuccess: () =>
          hidden
            ? showUndoToast({
                title: t('meetup.hidden'),
                description: meetup.title,
                onUndo: () => setHidden.mutate({ meetup, hidden: false }, { onError }),
              })
            : showUndoToast({
                title: t('meetup.unhidden'),
                description: meetup.title,
                onUndo: () => setHidden.mutate({ meetup, hidden: true }, { onError }),
              }),
        onError,
      },
    )
  }

  return { answer, hide, responseLabel: (r: MeetupResponse) => t(RESPONSE_LABEL[r]) }
}

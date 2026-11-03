// Small read-only helpers on meetup data. The server decides; these only choose what to show.
import type { MeetupSummaryV1 } from '@thongyod/shared'

/** Answers (and hide/unhide) are closed after `responseLocksAt` (start + 10 min, decision #33/#40). */
export function isLocked(meetup: Pick<MeetupSummaryV1, 'responseLocksAt'>, now: Date): boolean {
  return now.getTime() >= new Date(meetup.responseLocksAt).getTime()
}

/** The creator cannot hide their own meetup (decision #32). */
export function canHide(meetup: Pick<MeetupSummaryV1, 'createdBy'>, myUserId: string | undefined): boolean {
  return myUserId !== undefined && meetup.createdBy.userId !== myUserId
}

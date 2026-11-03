// PROVISIONAL frontend types for endpoints that Codex has not finalized yet
// (requests listed in docs/HANDOFF.md, 2026-11-03). Replace with @thongyod/shared types
// when the backend contract is published. Keep field names close to the request.
import type { MeetupDetail, MeetupResponse, MeetupSummary } from '@thongyod/shared'

export type PersonRef = {
  userId: string
  displayName: string
  avatarUrl: string | null
}

export type MeetupMember = PersonRef & {
  /** null = has not answered. Members who hid the meetup are never listed (except yourself). */
  response: MeetupResponse | null
  isGuest: boolean
  /** This row is the signed-in user. */
  isMe: boolean
}

/** Item of GET /meetups?from=&to= (calendar, agenda, "รอคุณตอบ"). */
export type MeetupListItem = MeetupSummary & {
  createdBy: PersonRef
  /** I created it: I cannot hide it (decision #32). */
  createdByMe: boolean
  /** You hid this meetup ("ซ่อนนัดนี้"). Hidden items are only returned when asked for. */
  myHidden: boolean
  /** Up to 3 people who are going, for the avatar stack. */
  goingPreview: PersonRef[]
}

/** GET /meetups/:id */
export type MeetupDetailFull = MeetupDetail & {
  createdBy: PersonRef
  createdByMe: boolean
  goingPreview: PersonRef[]
  myHidden: boolean
  /** Answers can no longer change after this time (start + 10 min). */
  answersLockAt: string
  members: MeetupMember[]
}

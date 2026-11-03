// API CONTRACT — shared by frontend and backend.
// Status: DRAFT types only; see HANDOFF frontend responses and DECISIONS #29–#37.
// Dates are ISO 8601 strings in UTC (e.g. "2026-11-03T11:00:00.000Z").

export type MeetupResponse = 'going' | 'maybe' | 'not_going'

export interface MeetupSummary {
  id: string
  title: string
  gangId: string
  gangName: string
  startsAt: string
  /** Number of members per response. */
  counts: Record<MeetupResponse, number>
  /** The current user's response; null = not answered yet. */
  myResponse: MeetupResponse | null
  /** Optional on legacy mocks; required in MeetupSummaryV1. Caller-only state. */
  myState?: MeetupViewerState
  goingAvatars?: MeetupGoingAvatar[]
}

// Proposed meetup v1 contract. These endpoints are not implemented yet.
// Identity and gang permissions must be agreed before backend implementation.
export interface CreateMeetupRequest {
  gangId: string
  title: string
  startsAt: string
  minPeople?: number | null
  maxPeople?: number | null
}

export interface MeetupDetail extends MeetupSummary {
  createdAt: string
  /** Compatibility fields; new API responses use MeetupDetailV1. */
  responseLocksAt?: string
  minPeople?: number | null
  maxPeople?: number | null
}

export type CreateMeetupResponse = MeetupDetail
export type GetMeetupResponse = MeetupDetail

export interface SetMeetupResponseRequest {
  response: MeetupResponse
}

/** Updated meetup, including the caller's response and aggregate counts. */
export type SetMeetupResponseResponse = MeetupDetail

export type MeetupErrorCode =
  | 'INVALID_REQUEST'
  | 'FORBIDDEN'
  | 'MEETUP_NOT_FOUND'
  | 'UNAUTHENTICATED'
  | 'RESPONSE_LOCKED'
  | 'CREATOR_CANNOT_HIDE'
  | 'ATTENDANCE_NOT_OPEN'
  | 'ATTENDANCE_LOCKED'
  | 'RECONFIRM_REQUIRED'
  | 'MEETUP_VERSION_CONFLICT'

/** Machine-readable errors; the frontend supplies localized UI text. */
export interface MeetupErrorResponse {
  error: {
    code: MeetupErrorCode
    field?: keyof CreateMeetupRequest | keyof SetMeetupResponseRequest
      | keyof UpdateMeetupRequest | keyof SetMeetupHiddenRequest | 'entries' | 'from' | 'to' | 'cursor'
  }
}

export type MeetupParticipationStatus =
  | 'unanswered' | MeetupResponse | 'waitlisted' | 'needs_reconfirm'

/** Never serialize another person's hidden flag or previous hidden answer. */
export interface MeetupViewerState {
  hidden: boolean
  needsReconfirm: boolean
  status: MeetupParticipationStatus
  waitlistPosition: number | null
}

export interface MeetupGoingAvatar {
  participantId: string
  displayName: string
  avatarUrl: string | null
}

export interface MeetupAccountRef {
  userId: string
  displayName: string
  avatarUrl: string | null
}

interface MeetupParticipantBase {
  participantId: string
  displayName: string
  avatarUrl: string | null
  /** Effective answer; null for unanswered, waitlisted, or needs_reconfirm. */
  response: MeetupResponse | null
  status: MeetupParticipationStatus
}

/** A guest has a stable participantId but no app userId. */
export type MeetupMember = MeetupParticipantBase & (
  | { isGuest: false; userId: string }
  | { isGuest: true; userId: null }
)

/** Complete new API shape. Legacy exports remain usable while mocks migrate. */
export interface MeetupSummaryV1 extends MeetupSummary {
  createdBy: MeetupAccountRef
  myState: MeetupViewerState
  goingAvatars: MeetupGoingAvatar[]
  responseLocksAt: string
  scheduleVersion: number
}

export interface MeetupDetailV1 extends MeetupSummaryV1 {
  createdAt: string
  members: MeetupMember[]
  minPeople: number | null
  maxPeople: number | null
  waitlistedCount: number
  needsReconfirmCount: number
  attendance: MeetupAttendanceSummary
}

export interface SetMeetupHiddenRequest { hidden: boolean }
export type SetMeetupHiddenResponse = MeetupDetailV1
export type ClearMeetupResponseResponse = MeetupDetailV1

/** Use for new PUT calls; legacy SetMeetupResponseRequest remains accepted as a type. */
export interface SetMeetupResponseRequestV1 extends SetMeetupResponseRequest {
  scheduleVersion: number
}

export interface UpdateMeetupRequest {
  title?: string
  startsAt?: string
  minPeople?: number | null
  maxPeople?: number | null
  scheduleVersion: number
}

export type MeetupAttendanceStatus = 'pending' | 'attended' | 'absent'
export interface MeetupAttendanceEntry {
  participantId: string
  status: MeetupAttendanceStatus
}
export interface MeetupAttendanceSummary {
  confirmationOpensAt: string
  confirmationDueAt: string
  finalizedAt: string | null
  finalizedBy: 'creator' | 'automatic' | null
  /** Only eligible visible participants, never hidden members. */
  entries: MeetupAttendanceEntry[]
}
export interface ConfirmMeetupAttendanceRequest {
  entries: Array<{ participantId: string; attended: boolean }>
}
export type ConfirmMeetupAttendanceResponse = MeetupDetailV1

export interface ListMeetupsRequest {
  /** Inclusive UTC instant. */
  from: string
  /** Exclusive UTC instant. */
  to: string
  visibility?: 'visible' | 'hidden' | 'all'
  cursor?: string
  limit?: number
}
export interface ListMeetupsResponse {
  items: MeetupSummaryV1[]
  nextCursor: string | null
}

/** Token is a bearer invitation to one meetup, never gang membership. */
export interface JoinMeetupGuestRequest {
  token: string
  nickname: string
}
export interface JoinMeetupGuestResponse {
  participantId: string
  meetupId: string
}

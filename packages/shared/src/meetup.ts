// API CONTRACT — shared by frontend and backend.
// Status: DRAFT from the frontend (mock data). Backend must confirm before building the endpoint.
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
}

// Proposed meetup v1 contract. These endpoints are not implemented yet.
// Identity and gang permissions must be agreed before backend implementation.
export interface CreateMeetupRequest {
  gangId: string
  title: string
  startsAt: string
}

export interface MeetupDetail extends MeetupSummary {
  createdAt: string
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

/** Machine-readable errors; the frontend supplies localized UI text. */
export interface MeetupErrorResponse {
  error: {
    code: MeetupErrorCode
    field?: keyof CreateMeetupRequest | keyof SetMeetupResponseRequest
  }
}

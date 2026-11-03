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

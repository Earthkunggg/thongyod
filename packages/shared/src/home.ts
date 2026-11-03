// API CONTRACT — shared by frontend and backend.
// Status: DRAFT from the frontend (mock data). Proposed endpoint: GET /home
// Rules:
// - Money is always an integer number of satang (1 baht = 100 satang). Never floats.
// - The API sends DATA, not UI sentences. The frontend builds the text in the user's
//   language from `kind` + fields. Only user-written content (names, titles) is sent as text.
// - Dates are ISO 8601 strings in UTC.

import type { MeetupSummary } from './meetup'

export type PendingKind = 'vote_time' | 'vote_restaurant' | 'pay_bill' | 'confirm_payment'

/** Something waiting for the current user ("รอคุณอยู่"). */
export interface PendingItem {
  id: string
  kind: PendingKind
  gangName: string
  /** User content: the meetup title (votes) or bill name (payments). */
  subject: string
  /** pay_bill: who to pay. confirm_payment: who paid. */
  counterpartName?: string
  /** pay_bill / confirm_payment only. */
  amountSatang?: number
  /** Votes: when voting closes. */
  dueAt?: string
}

export type FeedKind = 'meetup_created' | 'title_earned' | 'bill_paid'

/** A meaningful event from one of the user's gangs (not a full edit history). */
export interface FeedItem {
  id: string
  kind: FeedKind
  actorName: string
  /** User content: meetup title, title name, or bill name. */
  subject: string
  gangName: string
  createdAt: string
}

export type PetMood = 'happy' | 'normal' | 'missing_you' | 'sulking' | 'wilting'

export interface PetSummary {
  /** null = user has not named the pet; the UI shows the default name. */
  name: string | null
  mood: PetMood
}

/** Lucky color key; the UI translates it and picks the swatch. */
export type LuckyColorKey = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'black' | 'white' | 'gray'

export interface HomeSummary {
  /** Meetups in the current week (Mon-Sun) that the user can see. */
  weekMeetups: MeetupSummary[]
  /** The next upcoming meetup the user has not declined, if any. */
  nextMeetup: MeetupSummary | null
  pending: PendingItem[]
  pet: PetSummary
  /** null = feature off or birthday not set. */
  luckyColor: LuckyColorKey | null
  feed: FeedItem[]
}

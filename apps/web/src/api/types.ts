// PROVISIONAL frontend types for endpoints that Codex has not finalized yet
// (requests listed in docs/HANDOFF.md, 2026-11-03). Replace with @thongyod/shared types
// when the backend contract is published. Keep field names close to the request.
import type { MeetupDetail, MeetupResponse, MeetupSummary, PetSummary } from '@thongyod/shared'

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

// ---------- Friends (decision #34) ----------

/** How the signed-in user is related to another person. */
export type Relationship = 'self' | 'none' | 'friend' | 'request_sent' | 'request_received'

/** A person found by exact-name search or by a friend link. */
export type UserCard = PersonRef & {
  /** Main title shown on the profile (e.g. "สายมู"), or null. */
  title: string | null
  mutualFriends: number
  relationship: Relationship
  /** Set when relationship is request_sent or request_received. */
  requestId: string | null
}

export type FriendRequest = {
  id: string
  user: PersonRef
  mutualFriends: number
  createdAt: string
}

export type Friend = PersonRef & { title: string | null }

/** GET /friends */
export type FriendsOverview = {
  friends: Friend[]
  /** Requests other people sent me. */
  incoming: FriendRequest[]
  /** Requests I sent that are still waiting. */
  outgoing: FriendRequest[]
}

/** GET /friends/link. The frontend builds the URL: <origin>/add/<code>. */
export type FriendLink = { code: string }

// ---------- Profile (decision #36) ----------

/** GET /me — the signed-in user (basic). */
export type Me = PersonRef & { title: string | null; bio: string | null }

/** PATCH /me. Name rules (decision #40): 2–20 characters, unique (case-insensitive). */
export type UpdateMeRequest = { displayName?: string; bio?: string | null }

export type EarnedTitle = { id: string; name: string; gangName: string | null; earnedAt: string }

export type ProfileStats = {
  friends: number
  gangs: number
  /** Confirmed attendance, not answers (decision #33). */
  meetupsAttended: number
}

/** GET /users/:id/profile (also for myself). Private fields (birthday, gender) are never included. */
export type Profile = UserCard & {
  bio: string | null
  titles: EarnedTitle[]
  stats: ProfileStats
  pet: PetSummary | null
}

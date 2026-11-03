// Frontend API types.
// Meetups: the V1 contract in @thongyod/shared (owned by the backend, decision #40) — re-exported here.
// Friends / profile: PROVISIONAL until the backend publishes them in @thongyod/shared (see docs/HANDOFF.md).
import type { MeetupDetailV1, MeetupSummaryV1, PetSummary } from '@thongyod/shared'

/** One meetup in a list (calendar, agenda, "รอคุณตอบ"). */
export type MeetupListItem = MeetupSummaryV1
/** GET /meetups/:id */
export type MeetupDetailFull = MeetupDetailV1

export type PersonRef = {
  userId: string
  displayName: string
  avatarUrl: string | null
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

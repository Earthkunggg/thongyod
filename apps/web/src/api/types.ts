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

// ---------- Friends (decision #34, #43, #45) ----------

/** How the signed-in user is related to another person. */
export type Relationship = 'self' | 'none' | 'friend' | 'request_sent' | 'request_received'

/** A person with their unique @handle (decision #45). Display names may repeat. */
export type PersonCard = PersonRef & { handle: string }

/** A person found by handle or by a friend link. */
export type UserCard = PersonCard & {
  /** Main title shown on the profile (e.g. "สายมู"), or null. */
  title: string | null
  mutualFriends: number
  relationship: Relationship
  /** Set when relationship is request_sent or request_received. */
  requestId: string | null
}

export type FriendRequest = {
  id: string
  user: PersonCard
  mutualFriends: number
  createdAt: string
}

/** Item of GET /friends?q&cursor&limit (paged, decision #43). */
export type Friend = PersonCard & { title: string | null }

/** GET /friends/requests */
export type FriendRequests = {
  /** Requests other people sent me. */
  incoming: FriendRequest[]
  /** Requests I sent that are still waiting. */
  outgoing: FriendRequest[]
}

/** GET /friends/link. The frontend builds the URL: <origin>/add/<code>. */
export type FriendLink = { code: string }

// ---------- Profile (decision #36, #44, #45) ----------

/** GET /me — the signed-in user. */
export type Me = PersonCard & {
  title: string | null
  bio: string | null
  coverUrl: string | null
  /** When the handle may be changed again (once per 30 days); null = now. */
  handleChangeableAt: string | null
}

/** PATCH /me. Names: 2–20 chars, may repeat. Handle: unique, see features/profile/validation.ts. */
export type UpdateMeRequest = { displayName?: string; bio?: string | null; handle?: string }

export type EarnedTitle = {
  id: string
  name: string
  /** null when earned outside a gang, or when I am not in that gang (privacy, #44). */
  gangName: string | null
  earnedAt: string
}

export type ProfileStats = {
  friends: number
  gangs: number
  /** Confirmed attendance, not answers (decision #33). */
  meetupsAttended: number
}

/**
 * GET /users/:id/profile (also 'me'). Fields marked "friends" are null for non-friends (#44).
 * Never includes birthday or gender.
 */
export type Profile = UserCard & {
  coverUrl: string | null
  /** Up to 5 mutual friends (full list: GET /users/:id/mutual-friends). */
  mutualPreview: PersonCard[]
  /** Only gangs the viewer is also in. */
  sharedGangs: { id: string; name: string }[]
  /** friends */ bio: string | null
  /** friends (not self) */ friendsSince: string | null
  /** friends */ stats: ProfileStats | null
  /** friends */ titles: EarnedTitle[] | null
  /** friends */ pet: PetSummary | null
  /** friends: up to 5 upcoming meetups where we both answered going. */
  upcomingTogether: MeetupSummaryV1[] | null
}

// ---------- Gangs (minimal, for choosing a gang) ----------

/** GET /gangs — gangs I am a member of. */
export type GangSummary = { id: string; name: string; memberCount: number }

/** A member as other members see them (#44: shared gangs stay visible even after a block). */
export type GangMember = PersonCard & { title: string | null }

/** A title earned inside this gang (spec §11: titles are per gang). */
export type GangTitle = { id: string; name: string; holder: PersonRef; earnedAt: string }

/**
 * PROVISIONAL (frontend mock, not yet agreed with the backend — see HANDOFF).
 * GET /gangs/:id → GangDetail; 404 GANG_NOT_FOUND when the gang does not exist or I am not a member.
 * - members: every member (gang max 50, spec §16), sorted by display name; never people who left.
 * - upcoming: up to 5 meetups of this gang that start in the future, visible to me (not hidden by me), soonest first.
 * - titles: titles earned in this gang, newest first.
 */
export type GangDetail = GangSummary & {
  members: GangMember[]
  upcoming: MeetupSummaryV1[]
  titles: GangTitle[]
}

// ---------- Notifications (PROVISIONAL, frontend mock — see HANDOFF) ----------

/** What happened. The UI builds the sentence (#23); the API sends only data. Spec §14: pets never notify. */
export type NotificationKind =
  | 'meetup_invite'
  | 'meetup_time_changed'
  | 'meetup_cancelled'
  | 'meetup_reminder'
  | 'friend_request'
  | 'friend_accepted'
  | 'bill_reminder'
  | 'title_earned'
  | 'gang_settings_changed'

/** Where tapping a notification goes. null = nowhere (e.g. a cancelled meetup). */
export type NotificationTarget = { type: 'meetup'; id: string } | { type: 'user'; id: string } | { type: 'gang'; id: string } | { type: 'friend_requests' } | null

export type AppNotification = {
  id: string
  kind: NotificationKind
  createdAt: string
  /** null = unread. */
  readAt: string | null
  /** Who did it (null for reminders). */
  actor: PersonRef | null
  gangName: string | null
  /** User content: meetup title, bill name or title name. */
  subject: string | null
  /** meetup_time_changed / meetup_reminder: the (new) start time. bill_reminder: none. */
  startsAt: string | null
  /** bill_reminder: amount I owe, in satang. */
  amountSatang: number | null
  target: NotificationTarget
}

/** GET /notifications?cursor&limit → newest first + my unread total (for the bell). */
export type NotificationPage = CursorPage<AppNotification> & { unreadCount: number }

// ---------- Paging (decision #43) ----------

/** One page of a growing list. Pass `nextCursor` back as `cursor`; null = no more. Never parse a cursor. */
export type CursorPage<T> = { items: T[]; nextCursor: string | null }

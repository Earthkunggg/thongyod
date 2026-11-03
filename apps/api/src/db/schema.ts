import { sql } from 'drizzle-orm'
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, date } from 'drizzle-orm/pg-core'

const instant = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' })
export const gender = pgEnum('gender', ['male', 'female', 'other', 'unspecified'])
export const friendshipStatus = pgEnum('friendship_status', ['pending', 'accepted', 'declined', 'ended'])
export const response = pgEnum('meetup_response', ['going', 'maybe', 'not_going'])
export const sessionSource = pgEnum('session_source', ['line', 'local_dev'])
export const admissionRule = pgEnum('admission_rule', ['majority_48h', 'auto_unless_objection_24h'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  fixtureKey: text('fixture_key').unique(),
  displayName: text('display_name').notNull(),
  displayNameKey: text('display_name_key').notNull().unique(),
  avatarUrl: text('avatar_url'),
  birthDate: date('birth_date'),
  gender: gender('gender').notNull().default('unspecified'),
  bio: text('bio'),
  mainTitleKey: text('main_title_key'),
  createdAt: instant('created_at').notNull().defaultNow(),
}, (t) => [
  check('users_name_length', sql`char_length(${t.displayName}) between 2 and 20`),
  check('users_name_characters', sql`${t.displayName} ~ '^[A-Za-z0-9ก-๿ ._-]+$'`),
  check('users_name_normalized', sql`${t.displayName} = btrim(${t.displayName}) and ${t.displayNameKey} = lower(normalize(${t.displayName}, NFC))`),
])

export const authIdentities = pgTable('auth_identities', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id),
  provider: text('provider').notNull().default('line'),
  providerSubject: text('provider_subject').notNull().unique(),
}, (t) => [check('line_only', sql`${t.provider} = 'line'`)])

// Storage only in step 1. No session creation, cookies, or login endpoints yet.
export const sessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey(), userId: uuid('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(), source: sessionSource('source').notNull(),
  createdAt: instant('created_at').notNull().defaultNow(),
  expiresAt: instant('expires_at').notNull(), revokedAt: instant('revoked_at'),
}, (t) => [index('sessions_user').on(t.userId), check('session_expiry', sql`${t.expiresAt} > ${t.createdAt}`)])

export const friendships = pgTable('friendships', {
  id: uuid('id').primaryKey(), requesterId: uuid('requester_id').notNull().references(() => users.id),
  recipientId: uuid('recipient_id').notNull().references(() => users.id),
  status: friendshipStatus('status').notNull(), createdAt: instant('created_at').notNull(),
  respondedAt: instant('responded_at'),
}, (t) => [
  check('friendship_not_self', sql`${t.requesterId} <> ${t.recipientId}`),
  uniqueIndex('friendship_unordered_pair').on(sql`least(${t.requesterId}, ${t.recipientId})`, sql`greatest(${t.requesterId}, ${t.recipientId})`),
  index('friend_requests_recipient').on(t.recipientId, t.status),
  index('friend_request_rate').on(t.requesterId, t.createdAt),
])

export const blocks = pgTable('user_blocks', {
  blockerId: uuid('blocker_id').notNull().references(() => users.id),
  blockedId: uuid('blocked_id').notNull().references(() => users.id), createdAt: instant('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] }), check('block_not_self', sql`${t.blockerId} <> ${t.blockedId}`)])

export const friendLinks = pgTable('friend_link_tokens', {
  id: uuid('id').primaryKey(), userId: uuid('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(), createdAt: instant('created_at').notNull(), revokedAt: instant('revoked_at'),
}, (t) => [uniqueIndex('one_active_friend_link').on(t.userId).where(sql`${t.revokedAt} is null`)])

export const gangs = pgTable('gangs', {
  id: uuid('id').primaryKey(), createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: instant('created_at').notNull(),
})

export const gangSettings = pgTable('gang_settings', {
  gangId: uuid('gang_id').primaryKey().references(() => gangs.id), name: text('name').notNull(),
  pictureUrl: text('picture_url'), harshTitlesEnabled: boolean('harsh_titles_enabled').notNull().default(false),
  admissionRule: admissionRule('admission_rule').notNull().default('majority_48h'),
  version: integer('version').notNull().default(1), updatedAt: instant('updated_at').notNull(),
}, (t) => [check('settings_version', sql`${t.version} > 0`)])

export const gangMembers = pgTable('gang_members', {
  id: uuid('id').primaryKey(), gangId: uuid('gang_id').notNull().references(() => gangs.id),
  userId: uuid('user_id').notNull().references(() => users.id), joinedAt: instant('joined_at').notNull(), leftAt: instant('left_at'),
}, (t) => [
  uniqueIndex('one_active_membership').on(t.gangId, t.userId).where(sql`${t.leftAt} is null`),
  index('active_user_gangs').on(t.userId, t.gangId).where(sql`${t.leftAt} is null`),
  check('membership_period', sql`${t.leftAt} is null or ${t.leftAt} >= ${t.joinedAt}`),
])

export const meetups = pgTable('meetups', {
  id: uuid('id').primaryKey(), gangId: uuid('gang_id').notNull().references(() => gangs.id),
  createdBy: uuid('created_by').notNull().references(() => users.id), title: text('title').notNull(),
  startsAt: instant('starts_at').notNull(), timezone: text('timezone').notNull().default('Asia/Bangkok'),
  scheduleVersion: integer('schedule_version').notNull().default(1), createdAt: instant('created_at').notNull(),
}, (t) => [index('meetup_calendar').on(t.gangId, t.startsAt, t.id),
  check('meetup_title', sql`char_length(${t.title}) between 1 and 100 and ${t.title} = btrim(${t.title})`),
  check('meetup_version', sql`${t.scheduleVersion} > 0`),
])

// Account participants only in phase 1. No guest, waitlist, or attendance behavior.
export const meetupResponses = pgTable('meetup_responses', {
  id: uuid('id').primaryKey(), meetupId: uuid('meetup_id').notNull().references(() => meetups.id),
  userId: uuid('user_id').notNull().references(() => users.id), response: response('response'),
  hiddenAt: instant('hidden_at'), confirmedScheduleVersion: integer('confirmed_schedule_version').notNull().default(1),
  answeredAt: instant('answered_at'),
}, (t) => [uniqueIndex('one_meetup_response').on(t.meetupId, t.userId),
  index('visible_meetup_responses').on(t.meetupId).where(sql`${t.hiddenAt} is null`),
  check('response_version', sql`${t.confirmedScheduleVersion} > 0`),
])

export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  theme: text('theme').notNull().default('default'), language: text('language').notNull().default('th'),
  homeCards: jsonb('home_cards').notNull().default(sql`'[]'::jsonb`),
}, (t) => [check('preference_theme', sql`${t.theme} in ('default', 'cute')`), check('preference_language', sql`${t.language} in ('th', 'en')`)])

// Phase 1 home fixtures. These are data snapshots, not bill/vote/pet engines.
export const homeStates = pgTable('home_states', {
  userId: uuid('user_id').primaryKey().references(() => users.id),
  pending: jsonb('pending').notNull(), feed: jsonb('feed').notNull(), pet: jsonb('pet'), luckyColor: text('lucky_color'),
})

export const seedRuns = pgTable('seed_runs', {
  key: text('key').primaryKey(), anchor: instant('anchor').notNull(), version: integer('version').notNull(),
})

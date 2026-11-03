CREATE TYPE "public"."admission_rule" AS ENUM('majority_48h', 'auto_unless_objection_24h');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'declined', 'ended');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other', 'unspecified');--> statement-breakpoint
CREATE TYPE "public"."meetup_response" AS ENUM('going', 'maybe', 'not_going');--> statement-breakpoint
CREATE TYPE "public"."session_source" AS ENUM('line', 'local_dev');--> statement-breakpoint
CREATE TABLE "auth_identities" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text DEFAULT 'line' NOT NULL,
	"provider_subject" text NOT NULL,
	CONSTRAINT "auth_identities_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "auth_identities_provider_subject_unique" UNIQUE("provider_subject"),
	CONSTRAINT "line_only" CHECK ("auth_identities"."provider" = 'line')
);
--> statement-breakpoint
CREATE TABLE "user_blocks" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id"),
	CONSTRAINT "block_not_self" CHECK ("user_blocks"."blocker_id" <> "user_blocks"."blocked_id")
);
--> statement-breakpoint
CREATE TABLE "friend_link_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "friend_link_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY NOT NULL,
	"requester_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"status" "friendship_status" NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "friendship_not_self" CHECK ("friendships"."requester_id" <> "friendships"."recipient_id")
);
--> statement-breakpoint
CREATE TABLE "gang_members" (
	"id" uuid PRIMARY KEY NOT NULL,
	"gang_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "membership_period" CHECK ("gang_members"."left_at" is null or "gang_members"."left_at" >= "gang_members"."joined_at")
);
--> statement-breakpoint
CREATE TABLE "gang_settings" (
	"gang_id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"picture_url" text,
	"harsh_titles_enabled" boolean DEFAULT false NOT NULL,
	"admission_rule" "admission_rule" DEFAULT 'majority_48h' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "settings_version" CHECK ("gang_settings"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "gangs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "home_states" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"pending" jsonb NOT NULL,
	"feed" jsonb NOT NULL,
	"pet" jsonb,
	"lucky_color" text
);
--> statement-breakpoint
CREATE TABLE "meetup_responses" (
	"id" uuid PRIMARY KEY NOT NULL,
	"meetup_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"response" "meetup_response",
	"hidden_at" timestamp with time zone,
	"confirmed_schedule_version" integer DEFAULT 1 NOT NULL,
	"answered_at" timestamp with time zone,
	CONSTRAINT "response_version" CHECK ("meetup_responses"."confirmed_schedule_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "meetups" (
	"id" uuid PRIMARY KEY NOT NULL,
	"gang_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"timezone" text DEFAULT 'Asia/Bangkok' NOT NULL,
	"schedule_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "meetup_title" CHECK (char_length("meetups"."title") between 1 and 100 and "meetups"."title" = btrim("meetups"."title")),
	CONSTRAINT "meetup_version" CHECK ("meetups"."schedule_version" > 0)
);
--> statement-breakpoint
CREATE TABLE "seed_runs" (
	"key" text PRIMARY KEY NOT NULL,
	"anchor" timestamp with time zone NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"source" "session_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "auth_sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "session_expiry" CHECK ("auth_sessions"."expires_at" > "auth_sessions"."created_at")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" text DEFAULT 'default' NOT NULL,
	"language" text DEFAULT 'th' NOT NULL,
	"home_cards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "preference_theme" CHECK ("user_preferences"."theme" in ('default', 'cute')),
	CONSTRAINT "preference_language" CHECK ("user_preferences"."language" in ('th', 'en'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"fixture_key" text,
	"display_name" text NOT NULL,
	"display_name_key" text NOT NULL,
	"avatar_url" text,
	"birth_date" date,
	"gender" "gender" DEFAULT 'unspecified' NOT NULL,
	"bio" text,
	"main_title_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_fixture_key_unique" UNIQUE("fixture_key"),
	CONSTRAINT "users_display_name_key_unique" UNIQUE("display_name_key"),
	CONSTRAINT "users_name_length" CHECK (char_length("users"."display_name") between 2 and 20),
	CONSTRAINT "users_name_characters" CHECK ("users"."display_name" ~ '^[A-Za-z0-9ก-๿ ._-]+$'),
	CONSTRAINT "users_name_normalized" CHECK ("users"."display_name" = btrim("users"."display_name") and "users"."display_name_key" = lower(normalize("users"."display_name", NFC)))
);
--> statement-breakpoint
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_link_tokens" ADD CONSTRAINT "friend_link_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gang_members" ADD CONSTRAINT "gang_members_gang_id_gangs_id_fk" FOREIGN KEY ("gang_id") REFERENCES "public"."gangs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gang_members" ADD CONSTRAINT "gang_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gang_settings" ADD CONSTRAINT "gang_settings_gang_id_gangs_id_fk" FOREIGN KEY ("gang_id") REFERENCES "public"."gangs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gangs" ADD CONSTRAINT "gangs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "home_states" ADD CONSTRAINT "home_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_responses" ADD CONSTRAINT "meetup_responses_meetup_id_meetups_id_fk" FOREIGN KEY ("meetup_id") REFERENCES "public"."meetups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetup_responses" ADD CONSTRAINT "meetup_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_gang_id_gangs_id_fk" FOREIGN KEY ("gang_id") REFERENCES "public"."gangs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetups" ADD CONSTRAINT "meetups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_friend_link" ON "friend_link_tokens" USING btree ("user_id") WHERE "friend_link_tokens"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "friendship_unordered_pair" ON "friendships" USING btree (least("requester_id", "recipient_id"),greatest("requester_id", "recipient_id"));--> statement-breakpoint
CREATE INDEX "friend_requests_recipient" ON "friendships" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "friend_request_rate" ON "friendships" USING btree ("requester_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_membership" ON "gang_members" USING btree ("gang_id","user_id") WHERE "gang_members"."left_at" is null;--> statement-breakpoint
CREATE INDEX "active_user_gangs" ON "gang_members" USING btree ("user_id","gang_id") WHERE "gang_members"."left_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "one_meetup_response" ON "meetup_responses" USING btree ("meetup_id","user_id");--> statement-breakpoint
CREATE INDEX "visible_meetup_responses" ON "meetup_responses" USING btree ("meetup_id") WHERE "meetup_responses"."hidden_at" is null;--> statement-breakpoint
CREATE INDEX "meetup_calendar" ON "meetups" USING btree ("gang_id","starts_at","id");--> statement-breakpoint
CREATE INDEX "sessions_user" ON "auth_sessions" USING btree ("user_id");
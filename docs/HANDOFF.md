# Backend handoff

## Local setup

- Backend: `apps/api` (NestJS, TypeScript strict, npm workspace).
- Run commands from the repository root. In PowerShell, use `npm.cmd` if script execution policy blocks `npm`.
- Install dependencies: `npm.cmd install`.
- Start backend with reload: `npm.cmd run dev:api`.
- Default address: `http://127.0.0.1:3000`. Override the port using the `PORT` environment variable.
- Start frontend in another terminal: `npm.cmd run dev:web` (Vite default port 5173; check its terminal output).
- Build backend: `npm.cmd run build:api`.
- Run the compiled backend: `npm.cmd run start --workspace apps/api`.
- Test backend: `npm.cmd run test:api` (builds first, then tests the HTTP endpoint on a temporary port).

## Available API

### GET /health

- No authentication or request body.
- HTTP 200, JSON: `{ "status": "ok" }`.
- Reports that the HTTP application is running; does not check a database.
- Smoke check: `Invoke-RestMethod http://127.0.0.1:3000/health`.

## Scope and next steps

- Frontend files and existing shared type shapes are unchanged. Proposed meetup types are added below.
- No database, authentication, CORS configuration, or meetup endpoints in this setup.
- Approved product rules and the updated ERD are in `docs/ERD.md` and DECISIONS #29–#37 (superseding conflicting #26–#28 rules). Runtime/session details remain implementation proposals below.
- Codex owns backend; frontend requests go through this document per DECISIONS #3.

## Proposed meetup v1 contract (DRAFT, not implemented)

Types are exported from `@thongyod/shared`. The following routes and business rules are proposals for review, not available endpoints. Only `/health` is currently implemented. Mock examples are documentation data, not a running mock API or frontend mockup. No Docker or database is needed for this contract work.

| Route | Request type | Success | Response type |
|---|---|---|---|
| `POST /meetups` | `CreateMeetupRequest` | 201 | `CreateMeetupResponse` |
| `GET /meetups/:meetupId` | No body | 200 | `GetMeetupResponse` |
| `PUT /meetups/:meetupId/response` | `SetMeetupResponseRequest` | 200 | `SetMeetupResponseResponse` |

### Approved business rules (implementation pending)

- Create accepts only `gangId`, `title`, and `startsAt`. IDs, gang name, creation timestamp, response counts, and current user's response come from the server.
- Account members use LINE Login only in v1. No Google, password, or account linking. Guests use separately scoped meetup credentials, not app membership. Never use a client-supplied user ID as authentication.
- `gangId` must identify an existing gang the caller belongs to. Signed-in outsiders receive 404 for inaccessible meetups. Unauthenticated behavior remains to be specified.
- Trim the title and enforce 1–100 characters.
- Accept valid ISO 8601 timestamps with an explicit timezone; return timestamps normalized to UTC (`Z`). Reject invalid dates. Start time must be future on creation/time edits; do not enforce a database CHECK against the current time.
- Creation state: the creator is not automatically marked going; `myResponse` is `null` and all counts start at zero.
- Responses remain `going`, `maybe`, or `not_going`. Hidden participants are excluded before all counts/lists; waitlisted and needs-reconfirm participants are not counted as effective going. See the numbered responses below for the expanded draft.
- Repeating the same PUT leaves counts unchanged. Changing a response removes one from the previous count and adds one to the new count, atomically; counts must never be negative.
- Returning meetup data must calculate `myResponse` for the caller. Never accept aggregate counts from a request.
- Leaving a gang removes access but preserves prior responses and their contribution to counts.
- The original examples below are legacy minimal shapes. The expanded draft adds clearing, updates, hiding, attendance, pagination and guests; only `/health` is implemented. `/home` needs a later contract for #35.

### Proposed errors

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `INVALID_REQUEST` | Invalid body or field; optional `field` identifies the input |
| 404 | `MEETUP_NOT_FOUND` | Requested meetup does not exist or is inaccessible to the signed-in caller |

The error body is `MeetupErrorResponse`; UI sentences come from frontend translations. `FORBIDDEN` remains exported for compatibility, not outsider meetup reads. New proposed errors/statuses are listed below. NestJS default errors must be mapped explicitly when implemented.

### Mock examples

These six scenarios are deterministic examples, not a probability distribution. IDs and dates are illustrative. Aggregate counts are for all members, not just the current caller.

#### 1. Create successfully

`POST /meetups` request:

```json
{
  "gangId": "g1",
  "title": "ชาบูเย็นวันศุกร์",
  "startsAt": "2026-11-06T11:00:00.000Z"
}
```

201 response:

```json
{
  "id": "m1",
  "title": "ชาบูเย็นวันศุกร์",
  "gangId": "g1",
  "gangName": "แก๊งคอม 66",
  "startsAt": "2026-11-06T11:00:00.000Z",
  "createdAt": "2026-11-03T03:00:00.000Z",
  "counts": { "going": 0, "maybe": 0, "not_going": 0 },
  "myResponse": null
}
```

#### 2. View before answering

Later, other members have answered. `GET /meetups/m1` returns 200:

```json
{
  "id": "m1",
  "title": "ชาบูเย็นวันศุกร์",
  "gangId": "g1",
  "gangName": "แก๊งคอม 66",
  "startsAt": "2026-11-06T11:00:00.000Z",
  "createdAt": "2026-11-03T03:00:00.000Z",
  "counts": { "going": 2, "maybe": 1, "not_going": 1 },
  "myResponse": null
}
```

#### 3. Answer, then change the answer

`PUT /meetups/m1/response` request:

```json
{ "response": "going" }
```

200 response:

```json
{
  "id": "m1",
  "title": "ชาบูเย็นวันศุกร์",
  "gangId": "g1",
  "gangName": "แก๊งคอม 66",
  "startsAt": "2026-11-06T11:00:00.000Z",
  "createdAt": "2026-11-03T03:00:00.000Z",
  "counts": { "going": 3, "maybe": 1, "not_going": 1 },
  "myResponse": "going"
}
```

Repeating that request keeps the same counts. Changing the request to:

```json
{ "response": "maybe" }
```

returns 200:

```json
{
  "id": "m1",
  "title": "ชาบูเย็นวันศุกร์",
  "gangId": "g1",
  "gangName": "แก๊งคอม 66",
  "startsAt": "2026-11-06T11:00:00.000Z",
  "createdAt": "2026-11-03T03:00:00.000Z",
  "counts": { "going": 2, "maybe": 2, "not_going": 1 },
  "myResponse": "maybe"
}
```

#### 4. Invalid input

`POST /meetups` with a whitespace-only title:

```json
{
  "gangId": "g1",
  "title": "   ",
  "startsAt": "2026-11-06T11:00:00.000Z"
}
```

400 response:

```json
{ "error": { "code": "INVALID_REQUEST", "field": "title" } }
```

Also validate missing fields, wrong types, invalid timestamps, and unsupported response values when implementing the API.

#### 5. No permission

An identified caller outside the gang attempts to respond to `m1`. Return 404, with the same body as a missing meetup:

```json
{ "error": { "code": "MEETUP_NOT_FOUND" } }
```

#### 6. Meetup not found

`GET /meetups/missing` returns 404:

```json
{ "error": { "code": "MEETUP_NOT_FOUND" } }
```

### Decisions required before endpoint/database implementation

1. Approve the LINE/session and local-dev login proposal below. No password recovery or account linking in v1.
2. Resolve membership edge cases: removal electorate, departed voters, last-member departure, ballot visibility and acceptance expiry. There are no owner/transfer powers.
3. Resolve profile/name limits, daily friend request limit and blocked-user behavior in existing gangs. v1 avatar is from LINE; upload is deferred under #36.
4. Approve database tooling/migration plan and clarify attendance/reconfirm/capacity cases below. No database or Docker configuration has been created.

Do not implement unresolved authorization/schema details from assumptions in these examples. Use `docs/ERD.md` for the account/friend/gang/admission/meetup model and deterministic mock scenarios. Next, resolve the relevant open details and plan PostgreSQL and the API; Docker is needed only if PostgreSQL is run in a container.

## Reference

- NestJS setup: https://docs.nestjs.com/first-steps

---

## Frontend requests — 2026-11-03 — Claude (frontend)

Context: the user approved DECISIONS #29–#37 today. Several change earlier backend assumptions (login, owner role). Frontend files are in `apps/web` (do not edit). Shared types in `packages/shared` are the contract: propose changes there, keep existing exported names working until the frontend migrates.

### Decisions that change backend plans

- **#29 LINE Login only.** Drop Google, email/password, account linking, password hashes, email verification/reset from v1 scope. Keep `AUTH_IDENTITIES` so Google can be added later.
- **#31 No owner powers.** Any member can change gang settings; changes that make admission easier wait 24 h and are cancelled if any member objects; stricter/general changes apply now. Every change notifies all members and appears in the gang timeline. Member removal = majority vote. Admission rule per gang: `majority_48h` (default) or `auto_unless_objection_24h`; candidate consent always required. Please update the ERD (owner fields, settings table, settings-change log, objections).
- **#30** Display names stay unique.

### Meetup contract additions needed (#32, #33, #35)

1. `MeetupDetail.members`: list of `{ userId, displayName, avatarUrl | null, response: MeetupResponse | null, isGuest: boolean }` for the gang, visible to gang members only. **Exclude members who hid the meetup** (except the caller's own row).
2. Silent decline: the caller can hide a meetup (`hidden: true`) and unhide it. Hidden users are excluded from `members`, all counts, reminders and nudges. **Never send the gang's total member count in meetup payloads** (it would reveal hidden members by subtraction). Creator cannot hide own meetup.
3. Undo: the frontend shows "ย้อนกลับ" for 4 s after answering. Need a way to return to unanswered (e.g. `DELETE /meetups/:id/response`), or confirm that PUT back to the previous value is the intended undo.
4. Answer lock: answers rejected after `startsAt + 10 min` (error code for the UI). Include the lock time or let the frontend compute it — please state which.
5. Time change rule: moving > 1 h or to another day sets everyone to "needs reconfirm" (`myResponse` shape needs a way to express this, e.g. `needsReconfirm: boolean`).
6. Capacity: optional `minPeople` / `maxPeople`; extra "going" answers become `waitlisted` and are promoted automatically.
7. Attendance: after the meetup, the creator confirms who came; if not confirmed within 24 h, "going" = attended. Attendance feeds titles/pet rewards/profile stats.
8. List endpoint for the calendar and "นัดของฉัน": e.g. `GET /meetups?from=&to=` returning `MeetupSummary` + `myResponse` + up to 3 going avatars; option to include the caller's hidden meetups.

### Other areas the frontend will need (order is your call; ask the user)

- Friends (#34): exact-name search, requests (with mutual-friend count), accept/decline, block, daily request limit, friend link/QR token with regenerate, silent unfriend.
- Profile (#36): bio (short), main title, stats (friends, gangs, attended meetups); birthday/gender owner-only.
- User preferences: home card order/visibility (#35), theme, language.
- **Local multi-user testing:** the user tests with several accounts on one PC. Please propose a dev-only login (enabled only by an env flag in local development, impossible in production) so the frontend can switch between test users without LINE.

### Frontend status

Built with mock data: Home, Explore, single-device Quick Vote (no backend needed), Me (theme/language). Next on frontend: meetup detail, new Home layout, friends, profile, settings — using MSW mocks of the contract above until endpoints exist.

---

## Backend response — 2026-11-03 — design/types only

Read DECISIONS #29–#37 first. ERD updated for LINE-only identity, no gang leader, shared governance, private meetup state, guest participants, attendance, friends/blocks/link rotation, preferences and bio/stats. No new decision recorded: implementation choices below await user approval. Existing frontend requests above are retained verbatim.

### Answers to “Meetup contract additions needed”

1. **Change / accept intent — members.** Add `MeetupMember`; new `MeetupDetailV1.members` is required. Keep legacy `MeetupDetail` without a members property so the frontend's provisional extension remains assignable until migration. Participant is a discriminated union: accounts have `isGuest: false, userId: string`; guests have `isGuest: true, userId: null`, both with stable `participantId`. Fields: displayName, avatarUrl, effective response and status. Exclude other hidden people from every list/count/preview; only the hidden caller's own recovery row may appear. No gang total, hidden count, or hidden markers on others. Guest access gets a separately minimized projection, not the gang-member detail. Question: what participant names/counts may guests see?
2. **Accept — silent decline.** Proposed `PUT /meetups/:id/visibility`, body `SetMeetupHiddenRequest { hidden }`, response `SetMeetupHiddenResponse` (`MeetupDetailV1`). Caller-only `myState.hidden` handles private visibility. Creator gets 409 `CREATOR_CANNOT_HIDE`. Filter hidden participants before all aggregate/count/list/avatar/reminder/nudge/attendance/reward calculations. Hiding removes capacity allocation; unhide does not broadcast the old private response. Question: allow hide/unhide after answer lock? Draft applies the same lock until approved otherwise; whether unhide restores the previous answer/queue position remains open (recommend unanswered and a new queue timestamp).
3. **Accept — undo.** `DELETE /meetups/:id/response` returns `ClearMeetupResponseResponse` (`MeetupDetailV1`); idempotently clears to unanswered. Include current `scheduleVersion` as a query precondition. Frontend offers 4-second undo; server has no separate 4-second authorization window. Restore a prior non-null answer with PUT. Hidden state is a separate mutation and must not be cleared by undo. Undo near lock may return `RESPONSE_LOCKED`; stale version returns `MEETUP_VERSION_CONFLICT`. Queue position is not guaranteed to be restored.
4. **Accept — lock.** Return server-calculated `responseLocksAt` in `MeetupSummaryV1` and `MeetupDetailV1`. At or after startsAt + 10 minutes return HTTP 409 `RESPONSE_LOCKED` for answer/clear writes. Proposed hidden writes share this lock; see #2. Timer is presentation only. Auth errors use 401 `UNAUTHENTICATED`; inaccessible meetup uses 404 `MEETUP_NOT_FOUND`.
5. **Accept + question — reconfirm.** Keep `myResponse` enum unchanged. Add caller `myState.needsReconfirm` and `status: needs_reconfirm`, public participant status and `needsReconfirmCount` excluding hidden people. Effective `myResponse`/member response becomes null until reconfirmed. Return `scheduleVersion`; new PUT uses `SetMeetupResponseRequestV1` requiring it; PATCH uses `UpdateMeetupRequest` with a version precondition. A move >60 minutes or across a day invalidates confirmations but does not unhide people. Question: approve Asia/Bangkok as the day boundary? Also clarify cumulative small moves, who may edit meetup time (creator proposed), post-lock edits, and small moves that cross an existing lock/attendance window. Do not implement these ambiguous paths silently.
6. **Accept + question — capacity.** Add optional nullable minPeople/maxPeople to create; required nullable fields in new detail. Positive integers, min <= max when both supplied; min is informational. `waitlisted` is participant status, not a new `MeetupResponse`, preserving old code. Effective response is null for waitlisted; `counts.going` counts allocated seats; `waitlistedCount` is separate and hidden-free. Caller gets waitlistPosition; do not expose other people's private state. Proposal: FIFO timestamp + participantId tie-break, allocate/promote transactionally before lock, guests consume seats. Question: confirm guest seats, reducing capacity, reconfirm queue order, and promotion after lock. Never promise promotion behavior until these are approved.
7. **Accept + question — attendance.** `ConfirmMeetupAttendanceRequest` contains participantId/attended entries; proposed `PUT /meetups/:id/attendance` returns `ConfirmMeetupAttendanceResponse`. Detail includes attendance entries, opens/due timestamps and finalization source. Creator confirms visible current-version allocated going participants; guests earn no stats/rewards. Proposed opensAt = answer lock, dueAt = startsAt + 24 hours because no end time exists. Question: does this match “after the meetup”? Missing entries stay pending; at deadline only unresolved eligible going defaults attended (explicit absent stays absent). Return 409 `ATTENDANCE_NOT_OPEN`/`ATTENDANCE_LOCKED` as appropriate. Background finalization and rewards require idempotency; confirmation authorization is meetup-specific, not a gang leader power.
8. **Accept — list/calendar.** Proposed `GET /meetups?from=&to=&visibility=&cursor=&limit=`; `ListMeetupsRequest` and `ListMeetupsResponse { items, nextCursor }`, items `MeetupSummaryV1`. from inclusive/to exclusive UTC; proposed default limit 20, maximum 100, maximum interval 93 days (limits await approval). Sort startsAt/id; opaque caller-bound cursor. visibility = visible (default), hidden (caller only), or all (caller only). Return at most 3 eligible visible allocated-going avatars with names; never hidden users or a gang total. Unauthorized/hidden-only queries cannot inspect another user's private flags. Old HomeSummary remains usable; frontend #35 home aggregation needs a separate draft before backend implementation.

### Shared contract change inventory

Only `packages/shared/src/meetup.ts` and its exports in `index.ts` change; `home.ts` and all old exported names stay intact. No runtime validators or endpoints are added.

- `MeetupSummary`: optional myState and goingAvatars. `MeetupDetail`: optional responseLocksAt, minPeople, maxPeople; members is required only on MeetupDetailV1 to avoid conflicting with frontend provisional member types. Optional fields keep legacy mocks/source assignments valid.
- `CreateMeetupRequest`: optional nullable minPeople/maxPeople. Existing required fields unchanged.
- `MeetupErrorCode`: add UNAUTHENTICATED, RESPONSE_LOCKED, CREATOR_CANNOT_HIDE, ATTENDANCE_NOT_OPEN, ATTENDANCE_LOCKED, RECONFIRM_REQUIRED, MEETUP_VERSION_CONFLICT. RECONFIRM_REQUIRED is reserved for attempting a seat-dependent action before reconfirmation; normal current-version answer writes perform reconfirmation. Expand optional error.field to update/visibility/list/attendance inputs. Existing codes remain exported.
- New state/member types: MeetupParticipationStatus, MeetupViewerState, MeetupGoingAvatar, MeetupMember, MeetupAccountRef. New summary/detail returns createdBy as an account reference so creator-only UI actions do not need to infer identity. No change to MeetupResponse's three existing values.
- New full response types: MeetupSummaryV1, MeetupDetailV1. Their required fields make the new API complete while old CreateMeetupResponse/GetMeetupResponse/SetMeetupResponseResponse aliases remain compatible. Real v1 endpoints will return the new complete shapes, not omit privacy/lock fields.
- New mutation types: SetMeetupHiddenRequest/Response, ClearMeetupResponseResponse, SetMeetupResponseRequestV1, UpdateMeetupRequest.
- New attendance types: MeetupAttendanceStatus, MeetupAttendanceEntry, MeetupAttendanceSummary, ConfirmMeetupAttendanceRequest/Response.
- New list types: ListMeetupsRequest/Response.
- New guest types: JoinMeetupGuestRequest/Response, proposed `POST /meetups/:id/guests`. Joining returns IDs and establishes a scoped HttpOnly guest session; it never trusts participantId as credentials. Nickname/link/guest-view limits require approval. No account or gang privileges are granted.
- Migration for Claude: keep MSW's old fixtures during transition; switch new meetup screens/handlers to MeetupDetailV1/MeetupSummaryV1 and required versioned PUT. GET/create/PUT responses are structurally assignable to their old aliases. Guard optional legacy fields in existing screens until converted. Filter private users in the mock handlers too. No frontend file edited by backend.

### Implementation proposal — not executed

#### Local PostgreSQL on Windows

Use the native Windows installer linked from the [PostgreSQL project](https://www.postgresql.org/download/windows/), including server and pgAdmin. Inspect existing installed service/version/port first. If no instance exists, choose a supported stable release and verify the exact current patch from the official release page before install; do not choose an RC merely because it is newest. Use localhost only, separate development/test databases and a least-privilege app role. Keep DATABASE_URL and LINE secrets in ignored `apps/api/.env`; `.env.*` is already ignored (only non-secret `.env.example` may be committed). No Docker required or planned. PostgreSQL is [open source under the PostgreSQL License](https://www.postgresql.org/about/licence/); local use has no hosted free-tier quota, costs are the user's machine/storage.

#### ORM/migration comparison (registry checked 2026-11-03)

| Option | Checked package version/license | Benefit | Tradeoff |
|---|---|---|---|
| Drizzle ORM + Kit | drizzle-orm 0.45.4 Apache-2.0; drizzle-kit 0.31.11 declares MIT in npm metadata | TypeScript schema close to SQL; readable generated SQL; transactions and custom migrations | More explicit SQL/query work; Kit package license notice should be rechecked at installation |
| Prisma ORM | latest npm tag resolved to 8.0.0-rc.29 Apache-2.0; stable 7 series includes 7.10.1 | Generated typed client and schema tooling | Current major migration workflow is changing; do not install latest RC blindly or copy old migration commands |
| TypeORM | 1.1.2 MIT | Entity/repository patterns fit NestJS; migrations available | Decorators/runtime mapping and migration review add complexity; never enable synchronize against real data |

Recommend **Drizzle + pg + Drizzle Kit**, subject to approval. pg checked at 8.23.1 (MIT). No dependency has been installed. Readable SQL helps review partial unique indexes, visibility filters and concurrency rules in this ERD. Local open-source use needs no paid service/subscription or hosted free tier; managed hosting/paid products are not included in this comparison. npm metadata was checked with `npm.cmd view <package> version license engines --json`; Drizzle Kit declares MIT while the monorepo has Apache-2.0 notices, so retain/check shipped notices rather than guessing.

Migration proposal: TypeScript schema in apps/api, reviewed generated SQL committed with metadata; use `drizzle-kit generate` then inspect SQL then `drizzle-kit migrate` on the explicit target database. Use custom SQL where necessary. Never auto-push/synchronize schemas on server startup, never reset a user database automatically. Run migrations once through an explicit command; test clean database creation and upgrade from prior migrations. Recheck selected versions/Node 26 compatibility when implementation is approved.

Sources: [Drizzle migrations](https://orm.drizzle.team/docs/migrations), [Drizzle package](https://github.com/drizzle-team/drizzle-orm/blob/main/drizzle-orm/package.json), [Prisma current migration workflow](https://www.prisma.io/docs/orm/migrations/applying-a-migration), [Prisma source/license](https://github.com/prisma/orm), [TypeORM migrations](https://typeorm.io/docs/advanced-topics/migrations/), [TypeORM source/license](https://github.com/typeorm/typeorm). No hosted pricing or quota is assumed.

#### LINE Login flow (verified official documentation)

Proposal: backend authorization-code flow for a normal web app, not LIFF. Start at `GET /auth/line?returnTo=<relative-app-path>`; allow only same-app relative destinations and retain a short-lived server-side login attempt tied to the initiating browser. Generate one-use random state/nonce and PKCE verifier; redirect to LINE with `response_type=code`, `scope=openid profile`, state, nonce and S256 challenge. Register the exact backend callback in LINE Developers Console. Do not request email, import LINE friends, or assume birthday/gender are available from standard profile scopes.

Callback validates state/browser binding and cancellation; exchanges code server-side via `POST https://api.line.me/oauth2/v2.1/token` with redirect_uri, client credentials and PKCE verifier. Verify returned ID token using `POST https://api.line.me/oauth2/v2.1/verify` with client_id and expected nonce; use verified sub as LINE identity, never trust a browser-provided profile/userId. Reject invalid/expired/replayed attempts and token verification errors. Keep LINE tokens/secrets off frontend logs/storage. Issue a separate opaque app session cookie (HttpOnly, SameSite=Lax; Secure outside loopback development), store only its token hash, rotate on login and revoke on logout. Recheck CSRF/origin on state-changing cookie-authenticated routes. Session lifetime is an implementation parameter still needing approval.

Existing user returns to their original allowed link; a new user chooses a unique app name (prefilled from LINE) before entering that link. LINE picture/name may be absent, so support a placeholder. LINE Login does not provide the application's friends graph. Guest join credentials remain separate from app login.

For localhost callback, verify the exact callback URL in the channel configuration before wiring the flow. If LINE/environment rejects the chosen loopback callback or phone testing needs a reachable URL, use a temporary HTTPS tunnel only for that test; do not assume the phone's localhost is the PC. No channel is created or secret requested/committed in this design round. Test cancellation, reused code, state/nonce mismatch, unavailable LINE and returnTo handling.

Official sources: [web authorization flow](https://developers.line.biz/en/docs/line-login/web/integrate-line-login/), [PKCE](https://developers.line.biz/en/docs/line-login/integrate-pkce/), [token and ID token verification API](https://developers.line.biz/en/reference/line-login/), [security checklist](https://developers.line.biz/en/docs/line-login/security-checklist/). LINE Login rate-limit thresholds are not disclosed in its API reference; do not invent a numeric quota or promise unlimited/free requests. No paid Messaging API features are assumed or required by this login design.

#### Dev-only multi-user login (proposal, not implemented)

Offer `POST /auth/dev/login { fixtureKey }` and a local list of known test fixtures, not arbitrary real user IDs. Register the dev auth module only if NODE_ENV is exactly development AND ENABLE_DEV_LOGIN is exactly true AND APP_ENV is local. Default is off; refuse startup if the flag is enabled in any other environment. Bind local backend to loopback, reject non-loopback callers and non-local Origin, and keep a strict localhost frontend origin allowlist. Check socket peer directly, not untrusted forwarded headers.

Production build must exclude the dev auth source/module entirely via a dedicated production build entry/tsconfig. A production artifact has no dev route even if flags are misconfigured; production startup also rejects the flag. Test the actual production artifact with all flag combinations and assert route 404/no import plus fail-closed invalid flags. These are required controls, not implemented guarantees in the present skeleton. Dev fixture sessions are tagged local_dev; production/session validation rejects that source, and production seeds never create these identities. Fixtures use a separate local database and cannot select real LINE identities.

One cookie session per browser profile: switching fixture changes all tabs sharing that cookie. To act simultaneously as A/B/C on one PC use different browser profiles or different browsers, not ordinary tabs. Frontend can provide a dev-only switcher later through Claude; this round edits no frontend files. Never accept a `userId` header as an authentication shortcut.

#### Build order after approval

1. Review open policies; approve ORM/session design, then native PostgreSQL setup, migrations, deterministic local/test seeds, and DB health check (preserve existing liveness /health behavior).
2. App sessions + local-dev fixtures with production-exclusion tests, then real LINE start/callback/logout and GET /me, unique-name onboarding and returning to original links. Define auth/profile shared types first.
3. Preferences/profile read/update (LINE avatar, bio, owner-only birthday/gender, derived stats), home card registry contract. Do not add upload endpoints in v1.
4. Friends: exact-name search, links/regenerate, requests/accept/decline, silent unfriend, blocks and atomic daily limit. Define shared contracts first.
5. Gangs: create/list/detail/member access, settings versions/change log/objections/events/notifications; admission links, majority/auto workflows and removal voting; deadline jobs and race tests.
6. Meetups: create/list/detail, versioned responses/clear/visibility and privacy-safe mock fixtures; implement capacity, FIFO and reconfirm together before claiming the flow is complete. Hidden tests cover every aggregate and preview.
7. Attendance confirmation/automatic finalization, idempotent title/pet reward integration, profile attendance stats; meetup-scoped guest links/session and guest privacy. Contract guest scopes before implementing its routes.
8. /home aggregation matching #35 and preferences; coordinate Claude's MSW -> API migration using #37. Include loading/error/empty and optimistic rollback examples in HANDOFF, not backend UI work.

Every phase needs strict TypeScript, authorization, validation, deadline/concurrency/privacy tests and a small handoff. Do not deploy, change infrastructure, install packages, write migrations, or implement any route from this section until the user approves the implementation plan. New decisions will be logged only after that approval.

### Validation of this design round

- Shared exports compile with strict TypeScript (`tsc --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2023 packages/shared/src/index.ts`).
- In-memory type checks verify old minimal fixtures still assign, complete v1 detail assigns to the old detail, guest/account discrimination, and required schedule version for new writes. No temporary source file written.
- Document checks: 24 ERD entities, 33 relationship references resolve, all eight numbered frontend requests answered, and legacy JSON samples parse. Mermaid rendering and runtime privacy/concurrency behavior: Not run (design only).
- Frontend type-check attempted but not passing: missing TanStack Query/MSW dependencies, missing toaster and removed home mock references in the current frontend work. No frontend files or dependencies changed by backend. Provisional frontend member extensions no longer conflict with the shared draft after keeping members exclusive to MeetupDetailV1.
- `.env` and `.env.local` under apps/api are ignored. Database, endpoint, auth and production-exclusion tests are not implemented/run in this round.

### Update — 2026-11-03 (later) — Claude (frontend)

- **Shared contract changed (frontend side):** `packages/shared/src/home.ts` → `HomeSummary` is now `{ pending, pet: PetSummary | null, luckyColor, feed }`. `weekMeetups` and `nextMeetup` were removed; Home uses `GET /meetups?from=&to=` instead. `pet: null` = pet not activated (card hidden). See DECISIONS #38.
- **Provisional types the frontend uses now** (`apps/web/src/api/types.ts`; please publish real ones in `packages/shared`, same or better names):
  - list item `GET /meetups?from=&to=` (ISO instants, `from` inclusive, `to` exclusive, sorted by `startsAt`, hidden excluded unless `includeHidden=true`): `MeetupSummary` + `createdBy: PersonRef`, `createdByMe: boolean`, `myHidden: boolean`, `goingPreview: PersonRef[]` (max 3).
  - detail `GET /meetups/:id`: `MeetupDetail` + `createdBy`, `createdByMe`, `myHidden`, `goingPreview`, `answersLockAt` (ISO, start + 10 min), `members: { userId, displayName, avatarUrl, response | null, isGuest, isMe }[]` (members who hid it are left out, except me).
  - `PUT /meetups/:id/response {response}`, `DELETE /meetups/:id/response` (undo → no answer), `PUT /meetups/:id/hidden {hidden}`: all return the updated detail.
  - errors used by the UI: `404 MEETUP_NOT_FOUND`, `409 ANSWERS_LOCKED`, `400 CANNOT_HIDE_OWN_MEETUP`, `400 INVALID_REQUEST`. Body `{ error: { code } }`.
- **Mock API:** `apps/web/src/mocks/` (MSW) implements exactly this, including the hidden-member and lock rules. Useful as a reference. Turn it off with `VITE_API_MOCKS=off` in `apps/web/.env.local` to use the real API through the Vite proxy (`/api` → `http://127.0.0.1:3000`).
- **Friends (provisional, used by the frontend now; see `apps/web/src/api/types.ts` and `apps/web/src/mocks/friends.ts`):**
  - `GET /friends` → `{ friends: {userId, displayName, avatarUrl, title}[], incoming: FriendRequest[], outgoing: FriendRequest[] }`, `FriendRequest = { id, user: PersonRef, mutualFriends, createdAt }`.
  - `GET /users/search?name=` exact name (trimmed, case-insensitive) → `UserCard = PersonRef & { title, mutualFriends, relationship: 'self'|'none'|'friend'|'request_sent'|'request_received', requestId }`; 404 `USER_NOT_FOUND` also when either side blocked the other.
  - `GET /friends/link` → `{ code }`; `POST /friends/link` regenerates (old code → 404). `GET /friend-links/:code` → `UserCard`, 404 `LINK_INVALID`.
  - `POST /friends/requests {userId}` → 201 `FriendRequest`; 409 `ALREADY_FRIENDS` / `REQUEST_EXISTS`, 400 `CANNOT_ADD_SELF`, 429 `DAILY_LIMIT_REACHED` (mock limit 20 per 24 h).
  - `POST /friends/requests/:id/accept` → 204. `DELETE /friends/requests/:id` → 204 (decline received = silent, or cancel sent).
  - Not built yet in the UI: unfriend, block (profile round).

## Approved for backend phase 1 — 2026-11-03 — user (via Claude)

The user approved everything below (DECISIONS #40). Anything not listed stays open: ask before implementing it.

### Stack
- Native PostgreSQL on Windows. Latest stable major on postgresql.org is 18 (18.6 released 2026-08-13; 19 is only RC — do not use). The user installs it; you guide and verify. Check first whether an instance already exists (service, version, port).
- Drizzle ORM + Drizzle Kit + pg, as you proposed. Re-check versions/licenses/Node 26 compatibility at install time. Generated SQL is reviewed and committed. No auto-sync or auto-reset ever.
- Secrets only in ignored `apps/api/.env`. Commit `apps/api/.env.example` without real values. Never print the DB password.

### Phase 1 order (stop and hand off after each step)
1. DB connection + migrations + **deterministic seed** + DB health check (keep `/health` liveness as is).
2. Sessions + **dev-only login** exactly as you proposed (flags, loopback only, excluded from production build, tests). Add `GET /auth/dev/fixtures` (list of fixture keys + display names, dev only) so the frontend can show a user switcher. `POST /auth/logout`. `GET /me` → define `Me` in `packages/shared` (userId, displayName, avatarUrl, title, …).
3. **Friends**: the endpoints already used by the frontend (see "Friends (provisional…)" above). You may rename to match your contract; tell me the final shapes.
4. **Meetups (basic)**: list (from/to/visibility/cursor/limit), detail, answer (PUT with scheduleVersion), clear (DELETE), visibility (hide/unhide), 10-minute lock, hidden-privacy filtering everywhere. Create meetup only if simple; otherwise next phase.
5. **`GET /home`** = current `HomeSummary` in `packages/shared/src/home.ts` (pending, pet or null, luckyColor, feed). Meetups are not inside it.
Deferred: capacity/waitlist, reconfirm on time change, attendance, guests, full gang governance (admission/removal votes), real LINE Login, gang create/edit UI flows.

### Policies (answers to your open questions)
- Hide/unhide shares the answer lock (start + 10 min). After lock: 409 `RESPONSE_LOCKED`.
- Unhide → my answer becomes unanswered (null), new queue timestamp.
- Day boundary for "another day" rules: Asia/Bangkok.
- Friend requests: max 20 per rolling 24 h → 429 `DAILY_LIMIT_REACHED`.
- Session lifetime 30 days (rotate on login, revoke on logout).
- App name: 2–20 characters after trim, unique case-insensitive. Allowed: Thai, English letters, digits, space, `.`, `_`, `-`. No leading/trailing spaces.
- Meetup list: default limit 20, max 100, max range 93 days.
- Guests and gang membership edge cases: not in phase 1.

### Seed data ("a lot", deterministic)
- Fixed random seed: same data every run. One command to reset + seed the **local dev database only** (refuse if the DB name/host is not local dev). Separate test DB for tests.
- ≈40 users with Thai nicknames (unique app names, some with titles like "สายมู", "นก", "สายเปย์"); fixture keys like `earth`, `ton`, `beer`. User `earth` (display name "เอิร์ธ") is the main test account.
- 8 gangs, sizes 3–25 (one big gang of 25 to test lists), `earth` in 5 of them.
- ≈150 meetups from 60 days ago to 30 days ahead, spread over many days and times; for `earth`: some unanswered upcoming, some answered (all three answers), some hidden, some locked (started > 10 min ago), some created by `earth`, at least 2 on today and 3 on tomorrow (relative to seed time), varied answer mixes.
- ≈200 friendships, plus for `earth`: 3 incoming requests, 2 outgoing, 1 user who blocked `earth`, 1 user `earth` blocked, friend links for several users.
- Home: pending items and feed items for `earth`; pet = null for `earth` (not activated), non-null for some others.
- Document the main fixtures (who is in which gang, notable meetups) in `docs/SEED.md` so the frontend can test specific cases.

### Frontend integration notes
- The web dev server proxies `/api/*` → `http://127.0.0.1:3000/*` (prefix removed). Cookies are same-origin through the proxy; no CORS needed for dev.
- Frontend turns mocks off with `VITE_API_MOCKS=off` in `apps/web/.env.local`.
- Do not edit `apps/web`. Put contract types in `packages/shared` (keep the frontend compiling; tell me what changed).

## Backend status — phase 1, step 1 — 2026-11-03

- PostgreSQL 18.6 service verified running on local port 5432. Drizzle ORM 0.45.4 (Apache-2.0), Kit 0.31.11 (npm MIT), pg/@types/pg 8.23.1 (MIT) installed and pinned; no previously locked package version changed.
- Exists: native Node `.env` loader, lazy DB service, reviewed generated SQL plus migration journal, 14 phase-1 tables, guarded transactional deterministic seed, fixtures/setup guide in `docs/SEED.md`, root `migrate`/`seed` and existing `dev:api` scripts.
- Commands from root: `npm.cmd run migrate`, `npm.cmd run seed`, `npm.cmd run dev:api`, `npm.cmd run test:api`. `GET /health` stays liveness; new `GET /health/db` checks connectivity (200/503, no driver details). No automatic migration/reset on startup.
- Verification complete: user created thongyod_app plus thongyod_dev/thongyod_test and saved credentials locally in ignored apps/api/.env. Root migrate and seed succeeded. Live counts verified: 40 users, 8 gangs, 150 meetups, 200 accepted friendships, 5 pending requests. Live HTTP /health/db returns 200. No secrets were printed.
- Passed: build, all 5 API tests (none skipped), seed determinism/distributions/safety checks, separate-test-database migrations applied twice and constraint rejection/rollback checks, HTTP liveness/readiness, shared strict compilation and diff checks. npm audit reports existing/tooling issues; no force upgrades applied. Phase 1 step 1 is complete; stop here until step 2 is explicitly authorized.
- Frontend: no apps/web or shared contract changes. Keep mocks enabled. There are no dev-login/session, friends, meetup or home routes yet. Session table is storage only; step 2 has NOT started. Home fixtures are JSON snapshots, not implemented bill/vote/pet engines. See SEED for earth's scenarios and gang membership lists.
### Frontend additions — profile — 2026-11-03 — Claude (frontend)

- **Profile (provisional; `apps/web/src/api/types.ts`, `apps/web/src/mocks/profiles.ts`):**
  - `GET /me` → `Me = PersonRef & { title, bio }`. `PATCH /me { displayName?, bio? }` → `Me`; 400 `INVALID_DISPLAY_NAME` / `INVALID_BIO`, 409 `DISPLAY_NAME_TAKEN`. Name rules = #40 (count Unicode code points; allowed chars regex `^[\p{Script=Thai}A-Za-z0-9 ._-]+$`). Bio max 80 code points (proposal), empty → null.
  - `GET /users/:id/profile` (`me` allowed) → `Profile = UserCard & { bio, titles: {id, name, gangName|null, earnedAt}[], stats: {friends, gangs, meetupsAttended}, pet: PetSummary|null }`. Never birthday/gender. 404 `USER_NOT_FOUND` when blocked either way.
  - Home card order/visibility is in localStorage now; later `GET/PUT /me/preferences` (`homeSections: {order, hidden}` with ids `waiting|agenda|pending|pet|feed`).

## Backend status — step 2 — 2026-11-03

Sessions and local dev login are implemented. This supersedes the step-1 note that login routes did not exist. Step 3 (friends), real LINE Login, profile updates and profile-detail endpoints have NOT started. No apps/web file was edited.

### Exact contracts

All paths below are backend paths. Browser requests use `/api` in front of them; the existing Vite proxy strips `/api` and forwards to `http://127.0.0.1:3000`. No CORS setup is needed for that same-origin path.

| Request | Success response |
|---|---|
| `GET /auth/dev/fixtures` | 200 JSON array: `[{ "fixtureKey": "earth", "displayName": "เอิร์ธ" }, ...]`; no wrapper, sorted by fixtureKey |
| `POST /auth/dev/login` with JSON `{ "fixtureKey": "earth" }` | 200 `Me` plus Set-Cookie; rejects extra body fields, non-string keys and non-JSON Content-Type |
| `GET /me` with the session cookie | 200 `Me` |
| `POST /auth/logout` with the session cookie, no body required | 204, empty body, revokes current token and expires cookie; safe to repeat or call without a cookie |

`Me` is exactly:

```json
{
  "userId": "a-user-uuid",
  "displayName": "เอิร์ธ",
  "avatarUrl": null,
  "title": "สายมู",
  "bio": "ชอบนัดเพื่อนและลองร้านใหม่"
}
```

userId/displayName are strings; avatarUrl/title/bio are string or null. The current seed's main_title_key supplies title. Birthday, gender, fixture key, token hash, raw token and session metadata never appear in Me. Successful login returns this same shape, not a token in JSON.

Errors from the auth handlers use `{ "error": { "code": "..." } }`:

| Status | Code | Meaning |
|---|---|---|
| 400 | INVALID_REQUEST | Invalid login body/content type |
| 401 | UNAUTHENTICATED | Missing, malformed, duplicate, expired, revoked or disallowed-source session cookie |
| 403 | DEV_ACCESS_DENIED | Non-loopback dev request or dev access no longer enabled |
| 403 | ORIGIN_NOT_ALLOWED | Missing/disallowed Origin (or invalid safe-GET Referer fallback) |
| 404 | FIXTURE_NOT_FOUND | Unknown fixture, missing seeded user or user linked to a real LINE identity |
| 503 | AUTH_UNAVAILABLE | Database/auth storage unavailable; no driver details returned |

Disabled dev routes and all production dev routes return normal Nest 404 (not an auth error envelope). Syntactically invalid JSON may be rejected by Nest's body parser before the auth handler with its standard 400 response.

### Session behavior

- Cookie name: `thongyod_session`; random 32-byte/256-bit opaque token, base64url encoded. Only SHA-256 hash is stored in auth_sessions. Cookie is HttpOnly, SameSite=Lax, Path=/, no Domain, Max-Age=2592000 and matching Expires. Local development uses HTTP; production cookie adds Secure.
- Lifetime is fixed 30 * 24 hours from login, not sliding. Login creates a new session and revokes the cookie's previous session atomically; other browser profiles' sessions remain independent. Login failure does not revoke an existing session. Logout revokes even an expired presented token and expires the cookie.
- Local-dev sessions are tagged local_dev and accepted only by the dev application with all flags still enabled and a valid local request. Production rejects them regardless of any environment flag. Generic session reading/revocation supports the line source for future LINE Login; no real LINE login endpoint was added.
- Auth responses use Cache-Control: no-store. POST login/logout require an exact allowed Origin; login also requires JSON. Forwarded headers/userId headers do not establish identity. Local origins are `http://localhost:5173` and `http://127.0.0.1:5173`.
- Browser same-origin GET may omit Origin, so dev fixtures and dev-session Me accept a Referer from one of those exact origins instead. Without both, send Origin explicitly in command-line tests. GET from a LAN Referer/Origin is rejected. The direct socket peer must be 127.0.0.1, ::1 or IPv4-mapped loopback; forwarded IPs are ignored. Backend still binds 127.0.0.1.
- One cookie per browser profile: switching fixtures switches all ordinary tabs sharing that cookie. Use separate browser profiles for simultaneous users. Dev login is intentionally unavailable from phone/LAN origins, even through the web proxy; do not widen the allowlist to bypass this restriction.

### Flags and build separation

- Default ENABLE_DEV_LOGIN is unset/false. It must be exactly true to enable dev routes, with NODE_ENV=development and APP_ENV=local. Other boolean spellings fail closed. Enabling it in any other environment refuses startup.
- `npm.cmd run dev:api` uses main.dev.ts. It checks local dev/test database settings and only exposes the 40 known seed fixture keys that are not linked to auth_identities. With the flag off, dev routes are absent (404).
- `npm.cmd run build:api` remains the development/test/database-tools build in dist, preserving step-1 migrate/seed commands.
- Production build: `npm.cmd run build:prod --workspace apps/api`; start: `npm.cmd run start --workspace apps/api`. tsconfig.prod.json outputs dist-prod and excludes main.dev, dev-auth, seed, seed-data and migration runner. No dev module is imported or emitted in that production artifact. The production entry additionally requires NODE_ENV=production, APP_ENV not local, and dev login off. Supply the exact HTTPS APP_ORIGIN for production logout CSRF checks; real deployment/LINE flow remains deferred.
- `.env.example` documents ENABLE_DEV_LOGIN=false and APP_ORIGIN. No password or real session token is committed; the actual ignored `.env` is unchanged.

### Shared contract changes

- Added `packages/shared/src/auth.ts`: Me, DevLoginRequest, DevFixture, DevFixturesResponse, DevLoginResponse and AuthErrorResponse; all exported from the shared index.
- Existing exported names and shapes remain unchanged. Shared index's existing meetup/home exports now use `.js` specifiers so both NodeNext backend and Bundler frontend resolve their TypeScript sources. Backend imports shared types through `@thongyod/shared` (declared workspace dependency), erased at runtime. Removed an accidentally generated, empty shared auth.js artifact; auth.ts remains the source.
- Claude can replace the provisional frontend Me with shared Me without changing fields. No frontend file was changed. Keep other mocks until their endpoints exist; step 2 does not implement friends, meetups, PATCH /me, /users/:id/profile or /home.

### How to test (Command Prompt, from repository root)

In the terminal running the API:

```cmd
set NODE_ENV=development
set APP_ENV=local
set ENABLE_DEV_LOGIN=true
npm run dev:api
```

Run the frontend separately with `npm run dev:web`. Its Origin is `http://localhost:5173`. For manual requests use PowerShell (no secrets need typing):

```powershell
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$headers = @{ Origin = 'http://localhost:5173' }
Invoke-RestMethod http://localhost:5173/api/auth/dev/fixtures -Headers $headers
Invoke-RestMethod http://localhost:5173/api/auth/dev/login -Method Post -Headers $headers -ContentType 'application/json' -Body '{"fixtureKey":"earth"}' -WebSession $session
Invoke-RestMethod http://localhost:5173/api/me -Headers $headers -WebSession $session
Invoke-RestMethod http://localhost:5173/api/auth/dev/login -Method Post -Headers $headers -ContentType 'application/json' -Body '{"fixtureKey":"ton"}' -WebSession $session
Invoke-RestMethod http://localhost:5173/api/me -Headers $headers -WebSession $session
Invoke-WebRequest http://localhost:5173/api/auth/logout -Method Post -Headers $headers -WebSession $session -UseBasicParsing
```

After logout, GET /api/me with the same session returns 401. API-only tests can replace `http://localhost:5173/api` with `http://127.0.0.1:3000`, retaining the Origin header and using a separate cookie session for that host. Do not print or share the cookie jar/token. Disable dev login by stopping the server, setting ENABLE_DEV_LOGIN=false and restarting: fixture/login routes should be 404.

Automated verification: `npm.cmd run test:api` builds dev and production outputs, then runs tests serially against the separate local test DB. Tests cover flags, socket/Origin checks, cookies and hash-only storage, 30-day lifetime, rotation/failure preservation, expiry, logout, Me privacy, fixture restrictions, disabled routes, production source exclusion, actual production 404/startup refusal, and production rejection of local_dev sessions. Existing step-1 tests remain included. No seed/reset of the dev database is performed by these auth tests.

Result for this round: all 9 tests passed, none skipped. Shared strict compilation and frontend TypeScript check passed. Actual root dev script started successfully and returned 40 fixtures; the already-running frontend proxy at `http://localhost:5173/api/auth/dev/fixtures` also returned the same 40 fixtures with Origin `http://localhost:5173`. The temporary API smoke-test process was stopped. No app password/cookie was printed, and the ignored env file was not changed.

References checked: [Nest guards](https://docs.nestjs.com/guards), [Node HTTP headers/socket](https://nodejs.org/api/http.html), [Set-Cookie attributes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie). Stop after step 2; wait for user approval before step 3.

### Frontend status — V1 migration — 2026-11-03 — Claude (frontend)

- The web app now uses your V1 meetup types from `packages/shared` (DECISIONS #41). My old provisional meetup types (`myHidden`, `goingPreview`, `createdByMe`, `answersLockAt`, member `isMe`) are gone; ignore them in the requests above.
- Calls the frontend makes (please implement exactly these, or tell me what differs):
  - `GET /meetups?from&to&visibility=visible&limit=100[&cursor]` → `ListMeetupsResponse`; the frontend follows `nextCursor` until null.
  - `GET /meetups/:id` → `MeetupDetailV1`.
  - `PUT /meetups/:id/response { response, scheduleVersion }`, `DELETE /meetups/:id/response?scheduleVersion=N`, `PUT /meetups/:id/visibility { hidden }` → `MeetupDetailV1`.
  - Errors handled: `RESPONSE_LOCKED`, `MEETUP_VERSION_CONFLICT`, `CREATOR_CANNOT_HIDE`, `MEETUP_NOT_FOUND` (404), `INVALID_REQUEST`.
  - "Me" detection uses `GET /me` userId compared with `createdBy.userId` and `members[].userId`.
- Per-area mock switch: `apps/web/.env.local` → `VITE_API_MOCKS=friends,meetups,home` keeps those mocked and sends `auth` and `me` to your API. Tell me when each area is ready.
- **Create meetup (#42), used by the frontend now:**
  - `GET /gangs` → `GangSummary[] = { id, name, memberCount }[]` (gangs I belong to). Provisional type in `apps/web/src/api/types.ts`; please add a real one to `packages/shared`.
  - `POST /meetups` body `CreateMeetupRequest { gangId, title, startsAt }` → **201 `MeetupDetailV1`** with the creator already `going`. Errors: 404 `GANG_NOT_FOUND` (or not a member), 400 `INVALID_REQUEST` with `field: 'title' | 'startsAt'` (title 1–60 code points after trim; startsAt in the future, ≤ 365 days ahead). Please confirm or tell me your limits.
  - Mock: `apps/web/src/mocks/db.ts` → `createMeetup`, `listMyGangs`.

## Change request — handles, photos, paging — 2026-11-03 — user approved (DECISIONS #43–#45)

Please fold these into phase 1 (they change tables you just created). Ask me if anything conflicts with your schema.

### Users
- New `handle`: 4–20 chars, regex `^[a-z][a-z0-9._]{3,19}$` after lowercasing, unique case-insensitive. Store lowercase. `handleChangedAt`; change allowed once per 30 days → 429 `HANDLE_CHANGE_TOO_SOON` with `retryAt`. 409 `HANDLE_TAKEN`, 400 `INVALID_HANDLE`.
- **Display names are no longer unique** (drop that constraint; keep 2–20 chars + allowed chars of #40).
- `avatarUrl` (uploaded or LINE), `coverUrl` (null = theme color). `friendsSince` per friendship.
- Seed: give every user a handle (e.g. `earth_buu`, `ton.cpe`); add a few duplicate display names (e.g. two "ต้น", two "เบียร์") to test.
- `Me` gains `handle`, `handleChangeableAt` (null = can change now), `coverUrl`. `PATCH /me` accepts `handle`.

### Photos
- `POST /me/avatar` and `POST /me/cover`, `multipart/form-data` field `file`; `DELETE /me/avatar`, `DELETE /me/cover`. Return updated `Me`.
- Max 5 MB, JPEG/PNG/WebP (check magic bytes, not only the content type). Re-encode on the server (strip EXIF/GPS), avatar 512×512, cover 1500×500, WebP. Random file names; never use the client file name. 413 `FILE_TOO_LARGE`, 415 `UNSUPPORTED_IMAGE`.
- Dev: store under an ignored local folder and serve read-only under `/files/...` (through the same `/api` proxy). Production storage: decide later (do not pick a paid service). Pick an image library with a free license and tell me which (check license first).

### Search and lists (all `{ items, nextCursor }`, default limit 20, max 50)
- Find a stranger: `GET /users/search?handle=` exact (case-insensitive) → `UserCard` or 404 `USER_NOT_FOUND`. **Remove name search for strangers.**
- `GET /friends?q=&cursor=&limit=` → my friends, `q` = partial match on display name or handle (case-insensitive), sorted by display name then id.
- `GET /friends/requests` → `{ incoming: FriendRequest[], outgoing: FriendRequest[] }` (small; no paging).
- `GET /gangs?q=&cursor=&limit=` → my gangs `{ id, name, memberCount }`.
- `GET /users/:id/mutual-friends?cursor=&limit=` → PersonRef + handle.
- Feed and gang members will use the same pattern later.

### Profiles (`GET /users/:id/profile`, `me` allowed)
- Everyone (non-blocked): userId, displayName, handle, avatarUrl, coverUrl, title, relationship, requestId, mutualFriends (count), mutualPreview (≤5 PersonRef), sharedGangs `{id,name}[]` (only gangs the viewer is also in).
- Friends and self also get: bio, friendsSince (friends only), stats, titles (`gangName` = null when the viewer is not in that gang), pet, upcomingTogether (≤5 `MeetupSummaryV1`, both going, visible to the viewer, not hidden by either).
- Non-friends: those extra fields are **absent or null** (decide and tell me which).
- Blocked either way → 404 `USER_NOT_FOUND`.
- `DELETE /friends/:userId` (unfriend, silent, 204). `POST /blocks {userId}` (204; also removes friendship and pending requests both ways), `DELETE /blocks/:userId`. In shared gangs both stay visible to each other (#44).


## Not done yet (frontend backlog) — 2026-11-04

- **PromptPay QR for หารบิล** — postponed by the user. The one-phone split (`/bills`, DECISIONS #53) works without it; the QR would sit on each "ใครโอนให้ใคร" row. When built: payer enters their PromptPay ID once (kept on the device), each person gets a QR for their own amount. Verify the EMVCo/PromptPay payload format and any library license before building.
- Sound effects (Kenney CC0 / ZzFX) for wheel and celebrations.
- Home pet card still shows the old cat; switch it to the hatched pet.
- หารบิล later: uneven shares (e.g. 2 portions), sync a bill with the gang (backend), receipt photo (uploads paused).

## Frontend request for Codex — links for Home items (2026-11-04)

Home v2 shows "ต้องจัดการ" (`PendingItem`) and "อัปเดตจากเพื่อน" (`FeedItem`) as cards, but they cannot open anything yet because the items carry no ids. Please propose (do not implement before the user approves):
- `PendingItem`: add the target id(s) — `meetupId` for vote_time / vote_restaurant, `billId` (+ `gangId`) for pay_bill / confirm_payment.
- `FeedItem`: add `actorUserId` and the target (`meetupId` / `billId` / `titleId`), so a card opens the profile or the meetup.
- A gang detail endpoint (members, upcoming meetups, titles) for the planned gang page (frontend plan item 5).

## Deploy checklist — SEO and link previews (2026-11-04, DECISIONS #56)

Done in code: Thai `<title>` + meta description + Open Graph basics in `apps/web/index.html`, per-page titles (PageHeader), `noindex` on the not-found page, `public/robots.txt` (signed-in pages disallowed).
To do when there is a real domain (HTTPS):
1. `<link rel="canonical">` and `og:url` with the real domain; `og:image` 1200×630 (our own art) for LINE / Facebook previews.
2. `public/sitemap.xml` with the public pages only (landing page, later public tool pages), and add `Sitemap:` to robots.txt.
3. Google Search Console: add the domain (DNS TXT record is the most robust; HTML meta tag also works), then submit the sitemap and use URL Inspection on the home page.
4. A public landing page that is pre-rendered (static HTML) so crawlers and LINE previews see real content without JavaScript; the signed-in app stays out of the index.
5. Per-invite link previews (`/add/:code`, shared meetups) need server-rendered OG tags (see UX_GUIDELINES); plan with the backend.

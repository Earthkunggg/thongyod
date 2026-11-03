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


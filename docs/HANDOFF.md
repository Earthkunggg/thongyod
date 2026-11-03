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
- Approved product rules and the ERD are in `docs/ERD.md` and DECISIONS #26–#28. Runtime identity/session design and remaining edge cases must be settled before implementing the affected endpoints.
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
- Meetups require login. Active gang members may create/read/respond. Support Google, LINE, and email/password through explicit linking; session and credential flows need a separate implementation contract. Never use a client-supplied user ID as authentication.
- `gangId` must identify an existing gang the caller belongs to. Signed-in outsiders receive 404 for inaccessible meetups. Unauthenticated behavior remains to be specified.
- Trim the title and enforce 1–100 characters.
- Accept valid ISO 8601 timestamps with an explicit timezone; return timestamps normalized to UTC (`Z`). Reject invalid dates. Start time must be future on creation/time edits; do not enforce a database CHECK against the current time.
- Creation state: the creator is not automatically marked going; `myResponse` is `null` and all counts start at zero.
- Responses are `going`, `maybe`, or `not_going`. Each member has at most one current response per meetup. Unanswered members are excluded from counts.
- Repeating the same PUT leaves counts unchanged. Changing a response removes one from the previous count and adds one to the new count, atomically; counts must never be negative.
- Returning meetup data must calculate `myResponse` for the caller. Never accept aggregate counts from a request.
- Leaving a gang removes access but preserves prior responses and their contribution to counts.
- This draft does not include removing a response, editing/deleting meetups, voting, pagination, or the `/home` endpoint.

### Proposed errors

| HTTP | `error.code` | Meaning |
|---|---|---|
| 400 | `INVALID_REQUEST` | Invalid body or field; optional `field` identifies the input |
| 404 | `MEETUP_NOT_FOUND` | Requested meetup does not exist or is inaccessible to the signed-in caller |

The error body is `MeetupErrorResponse`; UI sentences come from frontend translations. The existing draft `FORBIDDEN` code stays exported for compatibility but is not used for outsider meetup access. Unknown/inaccessible gang behavior for create and unauthenticated responses still need an error contract. NestJS default errors will need explicit mapping when these endpoints are implemented. Shared type comments remain draft pending endpoint implementation.

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

1. Authentication implementation: session/token transport, verification and password recovery, provider callbacks, credential storage, and unauthenticated errors. Login methods are approved; these mechanics are not yet designed.
2. Membership edge cases: initial owner creation/transfer, removal, vote editing/visibility, acceptance expiry, and eligibility of departed snapshot voters. Approved entry paths require majority and candidate consent; see `docs/ERD.md`.
3. Profile details: app-name length/allowed characters and exact normalization, upload limits/storage, friend discovery and retry/unfriend rules. Name uniqueness and private birthday/gender are approved.
4. Database tooling, migrations, runtime PostgreSQL configuration, and deletion/retention policies need a separate implementation plan. No Docker configuration has been created.

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

# Phase 1 local seed

Scope: database setup and deterministic fixtures only. No session/dev-login, friends, meetup or home API routes are implemented by this step. Do not disable frontend mocks yet.

## 1. PostgreSQL and app role (manual, passwords stay local)

PostgreSQL 18.6 is installed on Windows, listening on 127.0.0.1:5432. Open PowerShell and connect as the installer administrator:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h 127.0.0.1 -p 5432 -U postgres -d postgres -W
```

Enter the postgres password at the interactive prompt. In psql, run these separately:

```sql
CREATE ROLE thongyod_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;
```

```text
\password thongyod_app
```

Enter the app password twice when prompted (not in SQL or shell history). Then:

```sql
CREATE DATABASE thongyod_dev OWNER thongyod_app ENCODING 'UTF8' TEMPLATE template0;
CREATE DATABASE thongyod_test OWNER thongyod_app ENCODING 'UTF8' TEMPLATE template0;
```

```text
\q
```

If a role/database exists already, stop and inspect it rather than dropping it. The app role owns these two app databases so it can apply their migrations; it has no superuser, role-creation or database-creation powers. Keep development/test databases separate. In future deployment use a separate migration role/runtime privilege plan.

## 2. Configure the ignored env file

Run from repository root, only copying if `.env` does not already exist:

```powershell
if (!(Test-Path apps/api/.env)) { Copy-Item apps/api/.env.example apps/api/.env }
notepad apps/api/.env
```

Enter the app-role password in PGPASSWORD, not the postgres administrator password. Keep NODE_ENV=development, APP_ENV=local, PGHOST=127.0.0.1, PGPORT=5432, PGDATABASE=thongyod_dev, PGUSER=thongyod_app and TEST_PGDATABASE=thongyod_test. Use dotenv quotes for passwords containing `#` or spaces; choose the quote style appropriate to the value. Never paste `.env` into chat or commit it.

The backend uses Node's native env loader from an absolute path relative to the API module. Explicit PG fields avoid URL-encoding mistakes for passwords; DATABASE_URL is not used in this step. Existing process environment values take precedence. `.env.example` has placeholders only. Tests use the same local role/password but select TEST_PGDATABASE explicitly.

## 3. Migrate, seed, run

```powershell
npm.cmd run migrate
npm.cmd run seed
npm.cmd run dev:api
```

`migrate` builds and applies reviewed SQL using Drizzle's migration journal. Repeat runs apply only pending migrations. It never seeds, resets, or auto-syncs. To generate a later migration explicitly, run `npm.cmd run db:generate --workspace apps/api`, review the SQL, then migrate. Migration SQL and metadata under `apps/api/drizzle` belong in Git; passwords do not. Commands work with `npm` too if the terminal permits it.

`seed` deliberately clears the named app tables, including sessions, and recreates fixtures in ONE transaction. It rejects anything except NODE_ENV=development, APP_ENV=local, loopback host, port 5432, database thongyod_dev and role thongyod_app. It rechecks the actual server address, database and role before TRUNCATE, takes an advisory transaction lock, uses no CASCADE/schema drop, and rolls back on failure. It never targets thongyod_test or production. Unrelated tables are not reset. No startup reset occurs.

Health endpoints:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/health/db
```

- `/health`: original liveness `{ "status": "ok" }`, even when DB is unavailable.
- `/health/db`: SELECT 1 connectivity readiness, HTTP 200 `{ "status": "ok" }`; HTTP 503 `{ "status": "unavailable" }` on missing config/connection/query failure, without driver details. This checks connectivity, not migration completeness.
- Tests: `npm.cmd run test:api`. Without env credentials the PostgreSQL integration test is explicitly skipped; with env it migrates only thongyod_test, checks repeat migrations and invalid constraints, and rolls fixture writes back.

## Determinism and dates

Generator version 1 uses fixed random seed 20261103 and namespace-based UUIDs. IDs, names, relations, distribution and friend-link test tokens stay stable. Dates are relative to an anchor instant; the default is the time the seed command runs. The same anchor gives byte-for-byte equivalent generated data. To replay exact timestamps set SEED_ANCHOR in ignored `.env` to a fixed ISO instant. Remove that setting when you want today/tomorrow to move with the real date. Local calendar calculations use Asia/Bangkok (+07:00); storage is UTC. The applied anchor/version are saved in seed_runs.

No Math.random or network avatar images are used. Seed names are Thai, avatars are null (initial-based frontend fallback); these are fixture users, not real LINE identities. main_title_key holds sample title labels for UI testing, not evidence that the deferred rewards engine ran.

## Main users and friendships

40 users; all fixture keys are listed in `apps/api/src/db/seed-data.ts`. Primary keys are `fixtureId('user', fixtureKey)`.

| Fixture | App name | Notable case |
|---|---|---|
| earth | เอิร์ธ | Main user, five gangs, no activated pet |
| ton | ต้น | Incoming friend request to earth |
| beer | เบียร์ | Incoming friend request to earth |
| aom | ออม | Incoming friend request to earth |
| ploy | พลอย | Outgoing request from earth |
| mint | มิ้นท์ | Outgoing request from earth |
| fern | เฟิร์น | Has blocked earth |
| bam | แบม | Blocked by earth |

There are 200 accepted unordered friend pairs, plus exactly five pending requests above. Accepted pairs are deterministically shuffled; no duplicate/reversed pair, self-friendship or accepted relationship between earth and either blocker exists. Mutual friends can be derived from accepted relationships later; no search/request endpoint exists yet.

First ten users have friend-link fixtures. Test token format is `local-fixture-friend-<fixtureKey>-v1`, stored as SHA-256 hashes only. These are intentionally public, local test data and must never be used as production tokens. Friend-link routes are deferred to step 3.

## Gangs

Gang IDs are `fixtureId('gang', zeroBasedIndex)`. No owner role exists. created_by is audit only.

| Index | Name | Members | earth |
|---|---|---|---|
| 0 | แก๊งคอม 66 | 25 | Yes |
| 1 | ทีมแบดวันพุธ | 18 | Yes |
| 2 | เพื่อนมัธยม | 12 | Yes |
| 3 | สายกินหลังเรียน | 8 | Yes |
| 4 | ทีมโปรเจกต์ | 6 | Yes |
| 5 | ชมรมบอร์ดเกม | 5 | No |
| 6 | สายวิ่งเช้า | 4 | No |
| 7 | กลุ่มอ่านหนังสือ | 3 | No |

Exact member fixture keys can be obtained without a database or passwords after build:

| Gang index | Fixture keys |
|---|---|
| 0 | earth, ton, beer, aom, ploy, mint, fern, bam, nam, fah, bow, may, ann, ice, new, bank, boss, game, golf, james, joe, kong, mark, max, mix |
| 1 | earth, fern, bam, nam, fah, bow, may, ann, ice, new, bank, boss, game, golf, james, joe, kong, mark |
| 2 | earth, may, ann, ice, new, bank, boss, game, golf, james, joe, kong |
| 3 | earth, boss, game, golf, james, joe, kong, mark |
| 4 | earth, kong, mark, max, mix, mook |
| 5 | nan, nice, nut, oil, pan |
| 6 | peach, pim, ping, pond |
| 7 | pun, sky, view |

To regenerate this list from the source:

```powershell
node --input-type=module -e "import('./apps/api/dist/db/seed-data.js').then(m => { const d=m.createSeedData(new Date('2026-11-03T05:00:00.000Z')); console.log(d.memberIndexes.map((members,i)=>({gang:m.gangNames[i],members:members.map(j=>m.fixtureKeys[j])}))) })"
```

## Notable meetups for earth

150 meetups, spanning local calendar days -60 through +30. IDs are `fixtureId('meetup', zeroBasedIndex)`; mixed answers are seeded for other members. Creator never hides their own meetup; all responses reference members of that meetup's gang.

| Index | Name | Local time relative to anchor | earth state |
|---|---|---|---|
| 0 | นัดวันนี้ช่วงเช้า | Today 09:00 | going |
| 1 | กินข้าวเย็นวันนี้ | Today 19:00 | going |
| 2 | แบดพรุ่งนี้เช้า | Tomorrow 10:00 | maybe |
| 3 | คาเฟ่พรุ่งนี้บ่าย | Tomorrow 14:00 | not_going |
| 4 | นัดที่เอิร์ธซ่อนไว้ | Tomorrow 18:00 | hidden, response null |
| 5 | นัดล็อกคำตอบแล้ว | Anchor minus 20 min | going; lock already passed at seed time |
| 6 | เอิร์ธชวนกินชาบู | Day +2 18:00 | Creator, unanswered |
| 7 | นัดรอเอิร์ธตอบ | Day +3 17:00 | Unanswered |

Hidden fixture must disappear from other people's groups/counts/previews and earth's default calendar once the API is implemented. Creator's name/gang size must never be used to reconstruct a hidden-person count. Stored hidden state is private; this DB step does not yet implement response projections or API privacy filtering.

## Home fixtures and schema scope

home_states contains structured pending/feed fixtures for earth, pet null for earth and some other users, non-null pet data for others. Sample pending items include a time vote and a bill in integer satang. These are snapshots only: bill/vote/pet engines are not implemented. Home response types in packages/shared are unchanged; meetups stay outside HomeSummary.

Phase 1 schema includes users, LINE identity storage (empty), session storage (empty), preferences, friends/blocks/link tokens, gangs/settings/membership, meetups/responses, home snapshots and seed metadata. No attendance, guests, capacity, reconfirm behavior, governance voting or real LINE flow is implemented. meetup_responses is the account-only phase 1 subset of ERD MEETUP_PARTICIPANTS; later phases will migrate it deliberately. Do not infer that future behavior exists just because its shared draft types exist.

## Package versions and licenses

Checked before installation: drizzle-orm 0.45.4 (Apache-2.0), drizzle-kit 0.31.11 (npm metadata MIT), pg 8.23.1 and @types/pg 8.23.1 (MIT). Drizzle monorepo has Apache-2.0 notices; retain the shipped notices. Node 26.13.0 is used. No paid database service or Docker dependency is added.

Sources: [Drizzle PostgreSQL driver](https://orm.drizzle.team/docs/get-started-postgresql), [migration generation](https://orm.drizzle.team/docs/drizzle-kit-generate), [migration application](https://orm.drizzle.team/docs/drizzle-kit-migrate). Commands are pinned to the installed versions, rather than copying the latest RC examples.

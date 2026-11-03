import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { assertLocalDatabase, databaseConfig } from './config.js'
import { createSeedData, SEED_VERSION } from './seed-data.js'
import * as schema from './schema.js'

export async function seedDatabase(pool: Pool, anchor: Date): Promise<void> {
  assertLocalDatabase(pool.options, 'thongyod_dev')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const identity = await client.query<{ name: string; role: string; address: string }>(
      'SELECT current_database() AS name, current_user AS role, host(inet_server_addr()) AS address',
    )
    const actual = identity.rows[0]
    if (actual?.name !== 'thongyod_dev' || actual.role !== 'thongyod_app'
      || !['127.0.0.1', '::1'].includes(actual.address)) throw new Error('Local database identity mismatch')
    await client.query('SELECT pg_advisory_xact_lock(20261103)')
    // Explicit tables only, no CASCADE, no schema drop, transaction rollback on failure.
    await client.query(`TRUNCATE TABLE seed_runs, home_states, user_preferences, meetup_responses,
      meetups, gang_members, gang_settings, gangs, friend_link_tokens, user_blocks,
      friendships, auth_sessions, auth_identities, users`)
    const db = drizzle(client)
    const data = createSeedData(anchor)
    await db.insert(schema.users).values(data.users)
    await db.insert(schema.gangs).values(data.gangs)
    await db.insert(schema.gangSettings).values(data.settings)
    await db.insert(schema.gangMembers).values(data.memberships)
    await db.insert(schema.meetups).values(data.meetups)
    await db.insert(schema.meetupResponses).values(data.responses)
    await db.insert(schema.friendships).values(data.friendships)
    await db.insert(schema.blocks).values(data.blocks)
    await db.insert(schema.friendLinks).values(data.links)
    await db.insert(schema.homeStates).values(data.home)
    await db.insert(schema.userPreferences).values(data.preferences)
    await db.insert(schema.seedRuns).values({ key: 'phase1', anchor, version: SEED_VERSION })
    await client.query('COMMIT')
  } catch {
    await client.query('ROLLBACK')
    throw new Error('Seed failed; transaction rolled back. Check migration state and local database configuration.')
  } finally { client.release() }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let pool: Pool | undefined
  try {
    const config = databaseConfig()
    assertLocalDatabase(config, 'thongyod_dev')
    const anchor = new Date(process.env.SEED_ANCHOR ?? Date.now())
    if (!Number.isFinite(anchor.getTime())) throw new Error('Invalid seed anchor')
    pool = new Pool(config)
    await seedDatabase(pool, anchor)
    console.log('Local dev seed complete: 40 users, 8 gangs, 150 meetups, 200 accepted friendships, 5 requests. Sessions cleared; no login routes created.')
  } catch {
    console.error('Seed refused or failed. Requires NODE_ENV=development, APP_ENV=local, loopback:5432, thongyod_dev, and thongyod_app. No connection details logged.')
    process.exitCode = 1
  } finally { await pool?.end() }
}

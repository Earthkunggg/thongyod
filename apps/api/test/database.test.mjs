import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Pool } from 'pg'
import { databaseConfig, assertLocalDatabase } from '../dist/db/config.js'
import { migrateDatabase } from '../dist/db/migrate.js'
import { createSeedData, fixtureId, gangSizes } from '../dist/db/seed-data.js'

test('seed safety refuses other hosts, names, roles, ports, and non-local environments', () => {
  const env = { NODE_ENV: 'development', APP_ENV: 'local' }
  const valid = { host: '127.0.0.1', port: 5432, database: 'thongyod_dev', user: 'thongyod_app' }
  assert.doesNotThrow(() => assertLocalDatabase(valid, 'thongyod_dev', env))
  for (const patch of [{ host: 'example.com' }, { host: '127.0.0.1.example.com' }, { database: 'thongyod_prod' }, { database: 'thongyod_test' }, { user: 'postgres' }, { port: 5433 }]) {
    assert.throws(() => assertLocalDatabase({ ...valid, ...patch }, 'thongyod_dev', env))
  }
  for (const patch of [{ NODE_ENV: 'production' }, { NODE_ENV: undefined }, { APP_ENV: 'staging' }, { APP_ENV: undefined }]) {
    assert.throws(() => assertLocalDatabase(valid, 'thongyod_dev', { ...env, ...patch }))
  }
  assert.throws(() => databaseConfig({}), /configuration/)
})

test('seed is repeatable and satisfies the requested fixtures and privacy cases', () => {
  const anchor = new Date('2026-11-03T05:00:00.000Z')
  const data = createSeedData(anchor)
  assert.deepEqual(data, createSeedData(anchor))
  assert.equal(data.users.length, 40)
  assert.equal(new Set(data.users.map(u => u.displayNameKey)).size, 40)
  assert.equal(data.gangs.length, 8)
  assert.deepEqual(data.memberIndexes.map(m => m.length), gangSizes)
  assert.equal(data.memberIndexes.filter(m => m.includes(0)).length, 5)
  assert.equal(data.meetups.length, 150)
  assert.equal(data.friendships.filter(f => f.status === 'accepted').length, 200)
  const earth = fixtureId('user', 'earth')
  const requests = data.friendships.filter(f => f.status === 'pending')
  assert.equal(requests.filter(f => f.recipientId === earth).length, 3)
  assert.equal(requests.filter(f => f.requesterId === earth).length, 2)
  assert.equal(data.blocks.filter(b => b.blockedId === earth).length, 1)
  assert.equal(data.blocks.filter(b => b.blockerId === earth).length, 1)
  const pairs = data.friendships.map(f => [f.requesterId, f.recipientId].sort().join(':'))
  assert.equal(new Set(pairs).size, pairs.length)
  for (const block of data.blocks) assert.ok(!pairs.includes([block.blockerId, block.blockedId].sort().join(':')))
  const earthMeetups = data.meetups.filter(m => data.memberships.some(member => member.userId === earth && member.gangId === m.gangId))
  const localDay = value => new Date(value.getTime() + 7 * 3600_000).toISOString().slice(0, 10)
  assert.ok(earthMeetups.filter(m => localDay(m.startsAt) === '2026-11-03').length >= 2)
  assert.ok(earthMeetups.filter(m => localDay(m.startsAt) === '2026-11-04').length >= 3)
  assert.ok(earthMeetups.some(m => m.startsAt > anchor && !data.responses.some(r => r.meetupId === m.id && r.userId === earth)))
  for (const r of data.responses) {
    const meetup = data.meetups.find(m => m.id === r.meetupId)
    assert.ok(data.memberships.some(m => m.gangId === meetup.gangId && m.userId === r.userId))
    if (r.hiddenAt) assert.notEqual(r.userId, meetup.createdBy)
    if (r.answeredAt) assert.ok(r.answeredAt < meetup.startsAt)
  }
  for (const response of ['going', 'maybe', 'not_going']) assert.ok(data.responses.some(r => r.userId === earth && r.response === response))
  assert.equal(data.home.find(h => h.userId === earth).pet, null)
  assert.ok(data.home.some(h => h.pet !== null))
  assert.throws(() => createSeedData(new Date('invalid')))
})

test('PostgreSQL migrations are repeatable and constraints reject invalid data', {
  skip: !process.env.PGPASSWORD ? 'Configure apps/api/.env to run the separate test database checks' : false,
}, async () => {
  const config = databaseConfig({ ...process.env, PGDATABASE: process.env.TEST_PGDATABASE })
  assertLocalDatabase(config, 'thongyod_test')
  const pool = new Pool(config)
  try {
    const identity = await pool.query('SELECT current_database() AS name, current_user AS role')
    assert.equal(identity.rows[0].name, 'thongyod_test')
    assert.equal(identity.rows[0].role, 'thongyod_app')
    await migrateDatabase(pool)
    await migrateDatabase(pool)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const ids = [fixtureId('test-user', 0), fixtureId('test-user', 1)]
      await client.query("INSERT INTO users(id, display_name, display_name_key) VALUES ($1, 'Test_A', 'test_a'), ($2, 'Test_B', 'test_b')", ids)
      for (const [query, values, code] of [
        ["INSERT INTO users(id, display_name, display_name_key) VALUES ($1, 'TEST_A', 'test_a')", [fixtureId('test-user', 2)], '23505'],
        ["INSERT INTO users(id, display_name, display_name_key) VALUES ($1, 'A', 'a')", [fixtureId('test-user', 3)], '23514'],
        ["INSERT INTO friendships(id, requester_id, recipient_id, status, created_at) VALUES ($1,$2,$2,'accepted',now())", [fixtureId('test-friend', 0), ids[0]], '23514'],
        ["INSERT INTO user_blocks(blocker_id, blocked_id, created_at) VALUES ($1,$2,now())", [ids[0], fixtureId('missing-user', 0)], '23503'],
      ]) {
        await client.query('SAVEPOINT invalid_data')
        await assert.rejects(client.query(query, values), error => error.code === code)
        await client.query('ROLLBACK TO SAVEPOINT invalid_data')
      }
      await client.query("INSERT INTO friendships(id, requester_id, recipient_id, status, created_at) VALUES ($1,$2,$3,'accepted',now())", [fixtureId('test-friend', 1), ...ids])
      await client.query('SAVEPOINT reverse_friend')
      await assert.rejects(client.query("INSERT INTO friendships(id, requester_id, recipient_id, status, created_at) VALUES ($1,$2,$3,'pending',now())", [fixtureId('test-friend', 2), ids[1], ids[0]]), error => error.code === '23505')
      await client.query('ROLLBACK TO SAVEPOINT reverse_friend')
    } finally {
      await client.query('ROLLBACK')
      client.release()
    }
  } finally { await pool.end() }
})

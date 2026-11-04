import 'reflect-metadata'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { randomBytes, randomUUID } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { once } from 'node:events'
import { Pool } from 'pg'
import { NestFactory } from '@nestjs/core'
import { createDevAppModule } from '../dist/dev-auth/dev-app.module.js'
import { devLoginEnabled, assertDevRequest, assertMutationOrigin, assertProductionConfiguration } from '../dist/auth/policy.js'
import { readSessionCookie, sessionCookie, sessionHash, SESSION_SECONDS } from '../dist/auth/cookie.js'
import { databaseConfig, assertLocalDatabase } from '../dist/db/config.js'
import { migrateDatabase } from '../dist/db/migrate.js'

const origin = 'http://localhost:5173'
const localEnv = { NODE_ENV: 'development', APP_ENV: 'local', ENABLE_DEV_LOGIN: 'true' }
const request = (headers = {}, remoteAddress = '127.0.0.1', method = 'POST') => ({ headers, socket: { remoteAddress }, method })
function setEnv(values) {
  const previous = { ...process.env }
  Object.assign(process.env, values)
  return () => { for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key]; Object.assign(process.env, previous) }
}

test('all dev flags fail closed and Origin/peer checks ignore forwarded identity', () => {
  for (const node of ['development', 'production', undefined]) for (const app of ['local', 'production', undefined]) {
    const valid = node === 'development' && app === 'local'
    const env = { NODE_ENV: node, APP_ENV: app, ENABLE_DEV_LOGIN: 'true' }
    if (valid) assert.equal(devLoginEnabled(env), true)
    else assert.throws(() => devLoginEnabled(env))
    for (const flag of [undefined, 'false']) assert.equal(devLoginEnabled({ ...env, ENABLE_DEV_LOGIN: flag }), false)
  }
  assert.throws(() => devLoginEnabled({ ...localEnv, ENABLE_DEV_LOGIN: 'TRUE' }))
  const restore = setEnv(localEnv)
  try {
    assert.throws(() => assertProductionConfiguration())
    assert.doesNotThrow(() => assertDevRequest(request({ origin })))
    assert.doesNotThrow(() => assertDevRequest(request({ referer: `${origin}/gangs` }, '::ffff:127.0.0.1', 'GET')))
    for (const headers of [{}, { origin: 'null' }, { origin: 'https://evil.example' }, { origin: 'http://localhost:5173.evil.example' }, { origin: 'http://192.168.1.2:5173' }]) {
      assert.throws(() => assertDevRequest(request(headers)))
      assert.throws(() => assertMutationOrigin(request(headers)))
    }
    assert.throws(() => assertDevRequest(request({ origin, 'x-forwarded-for': '127.0.0.1' }, '192.168.1.2')))
    assert.throws(() => assertDevRequest(request({ referer: 'https://evil.example/' }, '127.0.0.1', 'GET')))
  } finally { restore() }
})

test('cookies are opaque, reject duplicates and become Secure outside local development', () => {
  const restore = setEnv(localEnv)
  try {
    const token = randomBytes(32).toString('base64url')
    const cookie = sessionCookie(token, new Date('2026-12-03T00:00:00Z'))
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/); assert.match(cookie, /Path=\//)
    assert.match(cookie, /Max-Age=2592000/); assert.ok(!cookie.includes('; Secure'))
    assert.equal(readSessionCookie(request({ cookie: cookie.split(';')[0] })), token)
    assert.equal(readSessionCookie(request({ cookie: `thongyod_session=${token}; thongyod_session=${token}` })), null)
    assert.equal(readSessionCookie(request({ cookie: 'thongyod_session=malformed' })), null)
    process.env.NODE_ENV = 'production'
    assert.match(sessionCookie(token, new Date()), /; Secure$/)
  } finally { restore() }
})

async function startProduction(env) {
  const socket = createServer()
  socket.listen(0, '127.0.0.1'); await once(socket, 'listening')
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  const child = spawn(process.execPath, [fileURLToPath(new URL('../dist-prod/main.js', import.meta.url))], {
    env: { ...process.env, NODE_ENV: 'production', APP_ENV: 'production', ENABLE_DEV_LOGIN: 'false', APP_ORIGIN: 'https://thongyod.example', ...env, PORT: String(port) },
    stdio: 'ignore', windowsHide: true,
  })
  const url = `http://127.0.0.1:${port}`
  for (let i = 0; i < 150; i++) {
    if (child.exitCode !== null) return { child, url, exited: true }
    try { if ((await fetch(`${url}/health`, { signal: AbortSignal.timeout(200) })).status === 200) return { child, url, exited: false } } catch {}
    await new Promise(resolve => setTimeout(resolve, 40))
  }
  child.kill()
  throw new Error('Production artifact startup timed out')
}
async function stop(child) {
  if (child.exitCode === null) { child.kill(); await once(child, 'exit') }
}

test('actual production artifact contains no dev module/routes and refuses enabled dev flags', async () => {
  const files = await readdir(new URL('../dist-prod/', import.meta.url), { recursive: true })
  assert.ok(!files.some(name => /dev-auth|main\.dev|seed-data/.test(name)))
  for (const name of files.filter(name => name.endsWith('.js'))) {
    const contents = await readFile(new URL(`../dist-prod/${name.replaceAll('\\', '/')}`, import.meta.url), 'utf8')
    assert.ok(!contents.includes("Controller('auth/dev')"))
    assert.ok(!contents.includes('dev-auth/'))
  }
  const production = await startProduction({})
  try {
    assert.equal(production.exited, false)
    assert.equal((await fetch(`${production.url}/auth/dev/fixtures`, { headers: { Origin: origin } })).status, 404)
    assert.equal((await fetch(`${production.url}/auth/dev/login`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{"fixtureKey":"earth"}' })).status, 404)
    assert.equal((await fetch(`${production.url}/me`)).status, 401)
  } finally { await stop(production.child) }
  for (const flags of [localEnv, { NODE_ENV: 'production', APP_ENV: 'local', ENABLE_DEV_LOGIN: 'true' }, { NODE_ENV: 'production', APP_ENV: 'production', ENABLE_DEV_LOGIN: 'true' }]) {
    const rejected = await startProduction(flags)
    try { assert.equal(rejected.exited, true); assert.notEqual(rejected.child.exitCode, 0) } finally { await stop(rejected.child) }
  }
})

test('real dev HTTP sessions rotate, expire, revoke, and never expose stored/private fields', {
  skip: !process.env.PGPASSWORD ? 'Configure the separate local test database first' : false,
}, async () => {
  const restore = setEnv({ ...localEnv, PGDATABASE: process.env.TEST_PGDATABASE })
  let app, disabledApp, production
  const config = databaseConfig()
  assertLocalDatabase(config, 'thongyod_test')
  const pool = new Pool(config)
  const ids = [randomUUID(), randomUUID(), randomUUID()]
  try {
    await migrateDatabase(pool)
    for (const [i, key] of ['earth', 'ton', 'beer'].entries()) {
      await pool.query('INSERT INTO users(id,fixture_key,display_name,display_name_key,bio,main_title_key,birth_date,gender) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [ids[i], key, `Auth_Test_${i}`, `auth_test_${i}`, 'Test bio', i === 0 ? 'สายมู' : null, '2003-01-01', 'other'])
    }
    await pool.query("INSERT INTO auth_identities(id,user_id,provider,provider_subject) VALUES($1,$2,'line',$3)", [randomUUID(), ids[2], randomUUID()])
    app = await NestFactory.create(createDevAppModule(), { logger: false })
    await app.listen(0, '127.0.0.1')
    const url = await app.getUrl()
    const call = (route, options = {}) => fetch(url + route, { ...options, headers: { Origin: origin, ...options.headers } })
    assert.equal((await call('/me')).status, 401)
    assert.equal((await call('/me', { headers: { 'X-User-Id': ids[0] } })).status, 401)
    const fixtures = await call('/auth/dev/fixtures')
    assert.deepEqual(await fixtures.json(), [{fixtureKey:'earth',displayName:'Auth_Test_0'},{fixtureKey:'ton',displayName:'Auth_Test_1'}])
    assert.equal(fixtures.headers.get('cache-control'), 'no-store')
    assert.equal((await fetch(url + '/auth/dev/fixtures')).status, 403)
    assert.equal((await fetch(url + '/auth/dev/fixtures', { headers: { Referer: origin + '/settings' } })).status, 200)
    const login = (body, cookie) => call('/auth/dev/login', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? {Cookie:cookie}: {}) }, body: JSON.stringify(body) })
    for (const body of [{}, {fixtureKey:123}, {fixtureKey:'earth',userId:ids[1]}, null]) assert.equal((await login(body)).status, 400)
    assert.equal((await login({fixtureKey:'not-a-fixture'})).status, 404)
    assert.equal((await login({fixtureKey:'beer'})).status, 404)
    assert.equal((await fetch(url + '/auth/dev/login', { method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{"fixtureKey":"earth"}' })).status,403)
    const first = await login({fixtureKey:'earth'})
    assert.equal(first.status, 200)
    const me = await first.json()
    assert.deepEqual(Object.keys(me).sort(), ['avatarUrl','bio','displayName','title','userId'])
    assert.equal(me.userId, ids[0]); assert.equal(me.bio, 'Test bio')
    const firstCookie = first.headers.get('set-cookie').split(';')[0]
    const firstToken = firstCookie.split('=')[1]
    assert.equal(firstToken.length, 43)
    assert.equal((await call('/me', {headers:{Cookie:firstCookie}})).status,200)
    assert.equal((await login({fixtureKey:'not-a-fixture'},firstCookie)).status,404)
    assert.equal((await call('/me', {headers:{Cookie:firstCookie}})).status,200)
    const stored = await pool.query('SELECT token_hash, expires_at-created_at AS duration FROM auth_sessions WHERE user_id=$1', [ids[0]])
    assert.equal(stored.rows.length,1)
    assert.equal(stored.rows[0].token_hash, sessionHash(firstToken))
    const duration = await pool.query('SELECT extract(epoch FROM expires_at-created_at)::int AS seconds FROM auth_sessions WHERE token_hash=$1',[sessionHash(firstToken)])
    assert.equal(duration.rows[0].seconds,SESSION_SECONDS)
    const second = await login({fixtureKey:'ton'},firstCookie)
    assert.equal(second.status,200)
    const secondCookie=second.headers.get('set-cookie').split(';')[0]
    assert.notEqual(secondCookie,firstCookie)
    assert.equal((await call('/me',{headers:{Cookie:firstCookie}})).status,401)
    assert.equal((await (await call('/me',{headers:{Cookie:secondCookie}})).json()).userId,ids[1])
    assert.equal((await fetch(url+'/auth/logout',{method:'POST',headers:{Cookie:secondCookie,Origin:'https://evil.example'}})).status,403)
    assert.equal((await call('/me',{headers:{Cookie:secondCookie}})).status,200)
    const logout=await call('/auth/logout',{method:'POST',headers:{Cookie:secondCookie}})
    assert.equal(logout.status,204);assert.equal(await logout.text(),'');assert.match(logout.headers.get('set-cookie'),/Max-Age=0/)
    assert.equal((await call('/me',{headers:{Cookie:secondCookie}})).status,401)
    assert.equal((await call('/auth/logout',{method:'POST'})).status,204)
    const third=await login({fixtureKey:'earth'})
    const thirdCookie=third.headers.get('set-cookie').split(';')[0]
    await pool.query("UPDATE auth_sessions SET created_at=now()-interval '31 days',expires_at=now()-interval '1 day' WHERE token_hash=$1",[sessionHash(thirdCookie.split('=')[1])])
    assert.equal((await call('/me',{headers:{Cookie:thirdCookie}})).status,401)
    const fourth=await login({fixtureKey:'earth'})
    const activeCookie=fourth.headers.get('set-cookie').split(';')[0]
    production=await startProduction({PGDATABASE:'thongyod_test'})
    assert.equal((await fetch(production.url+'/me',{headers:{Cookie:activeCookie,Origin:origin}})).status,401)
    const productionToken=randomBytes(32).toString('base64url')
    await pool.query("INSERT INTO auth_sessions(id,user_id,token_hash,source,created_at,expires_at) VALUES($1,$2,$3,'line',now(),now()+interval '30 days')",[randomUUID(),ids[1],sessionHash(productionToken)])
    const productionCookie=`thongyod_session=${productionToken}`
    const productionMe=await fetch(production.url+'/me',{headers:{Cookie:productionCookie}})
    assert.equal(productionMe.status,200);assert.equal((await productionMe.json()).userId,ids[1])
    const productionLogout=await fetch(production.url+'/auth/logout',{method:'POST',headers:{Cookie:productionCookie,Origin:'https://thongyod.example'}})
    assert.equal(productionLogout.status,204);assert.match(productionLogout.headers.get('set-cookie'),/; Secure$/)
    assert.equal((await fetch(production.url+'/me',{headers:{Cookie:productionCookie}})).status,401)
    process.env.ENABLE_DEV_LOGIN='false'
    assert.equal((await call('/me',{headers:{Cookie:activeCookie}})).status,401)
    disabledApp=await NestFactory.create(createDevAppModule(),{logger:false})
    await disabledApp.listen(0,'127.0.0.1')
    assert.equal((await fetch(`${await disabledApp.getUrl()}/auth/dev/fixtures`,{headers:{Origin:origin}})).status,404)
  } finally {
    await app?.close(); await disabledApp?.close(); if(production)await stop(production.child)
    await pool.query('DELETE FROM auth_sessions WHERE user_id=ANY($1::uuid[])',[ids])
    await pool.query('DELETE FROM auth_identities WHERE user_id=ANY($1::uuid[])',[ids])
    await pool.query('DELETE FROM users WHERE id=ANY($1::uuid[])',[ids])
    await pool.end(); restore()
  }
})

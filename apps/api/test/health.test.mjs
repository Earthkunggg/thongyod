import 'reflect-metadata'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../dist/app.module.js'
import { DatabaseService } from '../dist/db/database.service.js'

test('GET /health returns HTTP 200 with the health contract', async () => {
  const app = await NestFactory.create(AppModule, { logger: false })
  try {
    await app.listen(0, '127.0.0.1')
    const response = await fetch(`${await app.getUrl()}/health`)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /^application\/json\b/)
    assert.deepEqual(await response.json(), { status: 'ok' })
  } finally {
    await app.close()
  }
})

test('DB readiness succeeds or returns a sanitized 503 without changing liveness', async () => {
  const app = await NestFactory.create(AppModule, { logger: false })
  try {
    await app.listen(0, '127.0.0.1')
    const database = app.get(DatabaseService)
    database.check = async () => undefined
    const url = await app.getUrl()
    const healthy = await fetch(`${url}/health/db`)
    assert.equal(healthy.status, 200)
    assert.deepEqual(await healthy.json(), { status: 'ok' })
    database.check = async () => { throw new Error('DO_NOT_LEAK_DRIVER_DETAILS') }
    const unavailable = await fetch(`${url}/health/db`)
    assert.equal(unavailable.status, 503)
    assert.deepEqual(await unavailable.json(), { status: 'unavailable' })
    assert.equal((await fetch(`${url}/health`)).status, 200)
  } finally { await app.close() }
})

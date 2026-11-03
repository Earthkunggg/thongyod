import 'reflect-metadata'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../dist/app.module.js'

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

import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { createDevAppModule } from './dev-auth/dev-app.module.js'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(createDevAppModule())
  app.enableShutdownHooks()
  await app.listen(process.env.PORT ?? 3000, '127.0.0.1')
}

void bootstrap().catch(() => {
  console.error('Development API startup failed; check local flags and database configuration.')
  process.exitCode = 1
})

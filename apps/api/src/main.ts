import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'
import { assertProductionConfiguration } from './auth/policy.js'

async function bootstrap(): Promise<void> {
  assertProductionConfiguration()
  const app = await NestFactory.create(AppModule)
  app.enableShutdownHooks()
  await app.listen(process.env.PORT ?? 3000, '127.0.0.1')
}

void bootstrap().catch(() => {
  console.error('API startup failed; dev login must be disabled for the production entry point.')
  process.exitCode = 1
})

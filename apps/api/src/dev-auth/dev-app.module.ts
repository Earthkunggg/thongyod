import { Module, type DynamicModule } from '@nestjs/common'
import { AppModule } from '../app.module.js'
import { ALLOW_DEV_SESSIONS, devLoginEnabled } from '../auth/policy.js'
import { assertLocalDatabase, databaseConfig } from '../db/config.js'
import { DevAuthController, DevAuthGuard } from './dev-auth.controller.js'

@Module({})
class DevAppModule {}

export function createDevAppModule(): DynamicModule {
  if (process.env.NODE_ENV !== 'development' || process.env.APP_ENV !== 'local') {
    throw new Error('Development entry point requires local development mode')
  }
  const enabled = devLoginEnabled()
  if (enabled) {
    const config = databaseConfig()
    if (config.database !== 'thongyod_dev' && config.database !== 'thongyod_test') {
      throw new Error('Dev login requires the local dev or test database')
    }
    assertLocalDatabase(config, config.database)
  }
  return {
    module: DevAppModule,
    imports: [{ module: AppModule, providers: [{ provide: ALLOW_DEV_SESSIONS, useValue: enabled }] }],
    controllers: enabled ? [DevAuthController] : [],
    providers: enabled ? [DevAuthGuard] : [],
  }
}

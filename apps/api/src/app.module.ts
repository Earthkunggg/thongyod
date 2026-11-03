import { Module } from '@nestjs/common'
import { HealthController } from './health.controller.js'
import { DatabaseService } from './db/database.service.js'
import { AuthController } from './auth/auth.controller.js'
import { SessionService } from './auth/session.service.js'
import { ALLOW_DEV_SESSIONS } from './auth/policy.js'

@Module({
  controllers: [HealthController, AuthController],
  providers: [DatabaseService, SessionService, { provide: ALLOW_DEV_SESSIONS, useValue: false }],
  exports: [DatabaseService, SessionService],
})
export class AppModule {}

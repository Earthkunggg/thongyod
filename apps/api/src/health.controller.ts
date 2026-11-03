import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { DatabaseService } from './db/database.service.js'

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get()
  getHealth(): { status: 'ok' } {
    return { status: 'ok' }
  }

  @Get('db')
  async getDatabaseHealth(): Promise<{ status: 'ok' }> {
    try {
      await this.database.check()
      return { status: 'ok' }
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable' })
    }
  }
}

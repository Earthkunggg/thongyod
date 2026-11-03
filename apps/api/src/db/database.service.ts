import { Injectable, type OnApplicationShutdown } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { databaseConfig } from './config.js'
import * as schema from './schema.js'

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private pool: Pool | undefined

  get connection(): Pool {
    if (!this.pool) {
      this.pool = new Pool(databaseConfig())
      // Never log driver errors: they can include connection details or query data.
      this.pool.on('error', () => undefined)
    }
    return this.pool
  }

  get db() { return drizzle(this.connection, { schema }) }

  async check(): Promise<void> {
    await this.connection.query('SELECT 1')
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end()
  }
}

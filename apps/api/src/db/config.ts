import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import type { PoolConfig } from 'pg'

const envFile = new URL('../../.env', import.meta.url)
if (existsSync(envFile)) loadEnvFile(envFile)

export function databaseConfig(env: NodeJS.ProcessEnv = process.env): PoolConfig {
  const port = Number(env.PGPORT ?? '5432')
  if (!env.PGHOST || !env.PGDATABASE || !env.PGUSER || !env.PGPASSWORD
    || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Database configuration is missing or invalid; check apps/api/.env')
  }
  return {
    host: env.PGHOST, port, database: env.PGDATABASE,
    user: env.PGUSER, password: env.PGPASSWORD,
    connectionTimeoutMillis: 3000, query_timeout: 5000, max: 5,
  }
}

export function assertLocalDatabase(
  config: PoolConfig, database: 'thongyod_dev' | 'thongyod_test',
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (env.NODE_ENV !== 'development' || env.APP_ENV !== 'local'
    || !['127.0.0.1', 'localhost', '::1'].includes(config.host ?? '')
    || config.port !== 5432 || config.database !== database
    || config.user !== 'thongyod_app') {
    throw new Error('Refusing operation: requires the named local development database and app role')
  }
}

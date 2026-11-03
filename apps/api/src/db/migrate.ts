import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { fileURLToPath } from 'node:url'
import { databaseConfig } from './config.js'

export async function migrateDatabase(pool: Pool): Promise<void> {
  await migrate(drizzle(pool), { migrationsFolder: fileURLToPath(new URL('../../drizzle/', import.meta.url)) })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let pool: Pool | undefined
  try {
    pool = new Pool(databaseConfig())
    await migrateDatabase(pool)
    console.log('Database migrations applied.')
  } catch {
    console.error('Migration failed. Check local database access and migration SQL; connection details are not logged.')
    process.exitCode = 1
  } finally { await pool?.end() }
}

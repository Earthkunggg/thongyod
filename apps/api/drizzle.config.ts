import { defineConfig } from 'drizzle-kit'

// Generation needs no credentials. Migrations use the sanitized runtime runner.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
})

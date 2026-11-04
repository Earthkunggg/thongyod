import { Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import type { IncomingMessage } from 'node:http'
import { randomBytes, randomUUID } from 'node:crypto'
import { DatabaseService } from '../db/database.service.js'
import { ALLOW_DEV_SESSIONS, assertDevRequest, devLoginEnabled } from './policy.js'
import { readSessionCookie, sessionHash } from './cookie.js'
import type { Me } from '@thongyod/shared'

const meColumns = 'u.id AS "userId", u.display_name AS "displayName", u.avatar_url AS "avatarUrl", u.main_title_key AS title, u.bio'

@Injectable()
export class SessionService {
  constructor(
    private readonly database: DatabaseService,
    @Inject(ALLOW_DEV_SESSIONS) private readonly allowDevSessions: boolean,
  ) {}

  async me(request: IncomingMessage): Promise<Me> {
    const token = readSessionCookie(request)
    if (!token) throw new UnauthorizedException({ error: { code: 'UNAUTHENTICATED' } })
    let row: (Me & { source: 'line' | 'local_dev' }) | undefined
    try {
      const result = await this.database.connection.query<Me & { source: 'line' | 'local_dev' }>(
        `SELECT ${meColumns}, s.source FROM auth_sessions s JOIN users u ON u.id=s.user_id
         WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > clock_timestamp()`, [sessionHash(token)],
      )
      row = result.rows[0]
    } catch { throw new ServiceUnavailableException({ error: { code: 'AUTH_UNAVAILABLE' } }) }
    if (!row || (row.source === 'local_dev' && (!this.allowDevSessions || !devLoginEnabled()))) {
      throw new UnauthorizedException({ error: { code: 'UNAUTHENTICATED' } })
    }
    if (row.source === 'local_dev') assertDevRequest(request)
    return { userId: row.userId, displayName: row.displayName, avatarUrl: row.avatarUrl, title: row.title, bio: row.bio }
  }

  async createDevSession(userId: string, request: IncomingMessage): Promise<{ token: string; expiresAt: Date }> {
    if (!this.allowDevSessions || !devLoginEnabled()) throw new UnauthorizedException({ error: { code: 'UNAUTHENTICATED' } })
    assertDevRequest(request)
    const token = randomBytes(32).toString('base64url')
    const previous = readSessionCookie(request)
    const client = await Promise.resolve().then(() => this.database.connection.connect()).catch(() => {
      throw new ServiceUnavailableException({ error: { code: 'AUTH_UNAVAILABLE' } })
    })
    try {
      await client.query('BEGIN')
      if (previous) await client.query('UPDATE auth_sessions SET revoked_at=clock_timestamp() WHERE token_hash=$1 AND revoked_at IS NULL', [sessionHash(previous)])
      const result = await client.query<{ expiresAt: Date }>(
        `INSERT INTO auth_sessions(id,user_id,token_hash,source,created_at,expires_at)
         VALUES($1,$2,$3,'local_dev',statement_timestamp(),statement_timestamp()+interval '2592000 seconds') RETURNING expires_at AS "expiresAt"`,
        [randomUUID(), userId, sessionHash(token)],
      )
      await client.query('COMMIT')
      return { token, expiresAt: result.rows[0].expiresAt }
    } catch {
      await client.query('ROLLBACK').catch(() => undefined)
      throw new ServiceUnavailableException({ error: { code: 'AUTH_UNAVAILABLE' } })
    } finally { client.release() }
  }

  async logout(request: IncomingMessage): Promise<void> {
    const token = readSessionCookie(request)
    if (!token) return
    try {
      await this.database.connection.query('UPDATE auth_sessions SET revoked_at=clock_timestamp() WHERE token_hash=$1 AND revoked_at IS NULL', [sessionHash(token)])
    } catch { throw new ServiceUnavailableException({ error: { code: 'AUTH_UNAVAILABLE' } }) }
  }
}

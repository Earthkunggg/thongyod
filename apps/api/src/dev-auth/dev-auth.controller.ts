import { BadRequestException, Body, CanActivate, Controller, ExecutionContext, Get, Header, HttpCode, Injectable, NotFoundException, Post, Req, Res, ServiceUnavailableException, UseGuards } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { DatabaseService } from '../db/database.service.js'
import { SessionService } from '../auth/session.service.js'
import { assertDevRequest } from '../auth/policy.js'
import { sessionCookie } from '../auth/cookie.js'
import { fixtureKeys } from '../db/seed-data.js'
import type { DevFixture, Me } from '@thongyod/shared'

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    assertDevRequest(context.switchToHttp().getRequest<IncomingMessage>())
    return true
  }
}

@Controller('auth/dev')
@UseGuards(DevAuthGuard)
export class DevAuthController {
  constructor(private readonly database: DatabaseService, private readonly sessions: SessionService) {}

  @Get('fixtures')
  @Header('Cache-Control', 'no-store')
  async fixtures(): Promise<DevFixture[]> {
    try {
      const result = await this.database.connection.query<DevFixture>(
        `SELECT u.fixture_key AS "fixtureKey", u.display_name AS "displayName" FROM users u
         WHERE u.fixture_key = ANY($1::text[]) AND NOT EXISTS(SELECT 1 FROM auth_identities a WHERE a.user_id=u.id)
         ORDER BY u.fixture_key`, [fixtureKeys],
      )
      return result.rows
    } catch { throw new ServiceUnavailableException({ error: { code: 'AUTH_UNAVAILABLE' } }) }
  }

  @Post('login')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async login(@Body() body: unknown, @Req() request: IncomingMessage, @Res({ passthrough: true }) response: ServerResponse): Promise<Me> {
    if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')
      || !body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).length !== 1 || !('fixtureKey' in body) || typeof body.fixtureKey !== 'string') {
      throw new BadRequestException({ error: { code: 'INVALID_REQUEST' } })
    }
    if (!fixtureKeys.includes(body.fixtureKey)) throw new NotFoundException({ error: { code: 'FIXTURE_NOT_FOUND' } })
    let me: Me | undefined
    try {
      const result = await this.database.connection.query<Me>(
        `SELECT u.id AS "userId", u.display_name AS "displayName", u.avatar_url AS "avatarUrl", u.main_title_key AS title, u.bio
         FROM users u WHERE u.fixture_key=$1 AND NOT EXISTS(SELECT 1 FROM auth_identities a WHERE a.user_id=u.id)`, [body.fixtureKey],
      )
      me = result.rows[0]
    } catch { throw new ServiceUnavailableException({ error: { code: 'AUTH_UNAVAILABLE' } }) }
    if (!me) throw new NotFoundException({ error: { code: 'FIXTURE_NOT_FOUND' } })
    const session = await this.sessions.createDevSession(me.userId, request)
    response.setHeader('Set-Cookie', sessionCookie(session.token, session.expiresAt))
    return me
  }
}

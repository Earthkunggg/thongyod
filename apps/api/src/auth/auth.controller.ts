import { Controller, Get, Header, HttpCode, Post, Req, Res } from '@nestjs/common'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { SessionService } from './session.service.js'
import { assertMutationOrigin } from './policy.js'
import { clearSessionCookie } from './cookie.js'

@Controller()
export class AuthController {
  constructor(private readonly sessions: SessionService) {}

  @Get('me')
  @Header('Cache-Control', 'no-store')
  me(@Req() request: IncomingMessage) { return this.sessions.me(request) }

  @Post('auth/logout')
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  async logout(@Req() request: IncomingMessage, @Res({ passthrough: true }) response: ServerResponse): Promise<void> {
    assertMutationOrigin(request)
    await this.sessions.logout(request)
    response.setHeader('Set-Cookie', clearSessionCookie())
  }
}

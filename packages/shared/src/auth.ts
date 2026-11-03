/** GET /me and successful POST /auth/dev/login. No private profile fields. */
export interface Me {
  userId: string
  displayName: string
  avatarUrl: string | null
  title: string | null
  bio: string | null
}

export interface DevLoginRequest { fixtureKey: string }
export interface DevFixture { fixtureKey: string; displayName: string }
export type DevFixturesResponse = DevFixture[]
export type DevLoginResponse = Me
export interface AuthErrorResponse {
  error: { code: 'UNAUTHENTICATED' | 'INVALID_REQUEST' | 'FIXTURE_NOT_FOUND' | 'DEV_ACCESS_DENIED' | 'ORIGIN_NOT_ALLOWED' | 'AUTH_UNAVAILABLE' }
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { appUrl } from '@/lib/share'
import { friendLinkUrl, parseFriendLink } from './link'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('local and deployed demo links', () => {
  it('preserves local URLs for the existing backend/proxy', () => {
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } })
    vi.stubEnv('VITE_DEPLOY_MOCKS', 'false')
    expect(appUrl('/meetups/m1')).toBe('http://localhost:5173/meetups/m1')
    expect(friendLinkUrl('test_code')).toBe('http://localhost:5173/add/test_code')
  })

  it('generates refresh-safe demo/QR URLs beneath the repository path', () => {
    vi.stubGlobal('window', { location: { origin: 'https://example.github.io' } })
    vi.stubEnv('VITE_DEPLOY_MOCKS', 'true')
    vi.stubEnv('BASE_URL', '/thongyod/')
    expect(appUrl('/meetups/m1')).toBe('https://example.github.io/thongyod/#/meetups/m1')
    const link = friendLinkUrl('test_code')
    expect(link).toBe('https://example.github.io/thongyod/#/add/test_code')
    expect(parseFriendLink(link)).toBe('test_code')
  })

  it('scans both URL formats without accepting malformed codes or paths', () => {
    expect(parseFriendLink('https://another.example/add/test_code')).toBe('test_code')
    expect(parseFriendLink('https://another.example/thongyod/#/add/test_code?source=qr')).toBe('test_code')
    for (const link of ['not a url', 'https://example.com/#/add/abc', 'https://example.com/#/add/code/extra', 'https://example.com/#/other/test_code']) {
      expect(parseFriendLink(link)).toBeNull()
    }
  })
})

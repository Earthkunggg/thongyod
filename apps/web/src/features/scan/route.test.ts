import { describe, expect, it } from 'vitest'
import { scanTarget } from './route'

const ORIGIN = 'https://earth.github.io'
const go = (text: string) => scanTarget(text, ORIGIN, '/thongyod/')

describe('scanTarget: one scanner, every QR goes where it belongs', () => {
  it('friend links (demo and local shapes, any origin) → add friend', () => {
    expect(go('https://earth.github.io/thongyod/#/add/abcd1234')).toEqual({ kind: 'friend', to: '/add/abcd1234' })
    expect(go('http://localhost:5173/add/abcd1234')).toEqual({ kind: 'friend', to: '/add/abcd1234' })
  })

  it('room links and bare 6-digit codes → the room', () => {
    expect(go('https://earth.github.io/thongyod/#/games/rooms/482913')).toEqual({ kind: 'room', to: '/games/rooms/482913' })
    expect(go(' 305117 ')).toEqual({ kind: 'room', to: '/games/rooms/305117' })
    expect(go('https://thongyod.app/games/rooms/482913')).toEqual({ kind: 'room', to: '/games/rooms/482913' })
  })

  it('meetup links from any origin → the meetup, but not the "new meetup" page', () => {
    expect(go('https://earth.github.io/thongyod/#/meetups/m1')).toEqual({ kind: 'meetup', to: '/meetups/m1' })
    expect(go('http://localhost:5173/meetups/m-42')).toEqual({ kind: 'meetup', to: '/meetups/m-42' })
    expect(go('https://earth.github.io/thongyod/#/meetups/new').kind).toBe('page')
  })

  it('other pages open only when the link is ours', () => {
    expect(go('https://earth.github.io/thongyod/#/fortune')).toEqual({ kind: 'page', to: '/fortune' })
    expect(go('https://earth.github.io/thongyod/#/friends/qr?mode=scan')).toEqual({ kind: 'page', to: '/friends/qr?mode=scan' })
    expect(go('https://earth.github.io/head-guess')).toEqual({ kind: 'page', to: '/head-guess' })
    expect(go('https://earth.github.io/')).toEqual({ kind: 'page', to: '/' })
    expect(go('https://earth.github.io/thongyod/')).toEqual({ kind: 'page', to: '/' })
    expect(go('https://example.com/fortune')).toEqual({ kind: 'unknown' })
    expect(go('https://example.com/#/fortune')).toEqual({ kind: 'unknown' })
    expect(go('https://example.com/')).toEqual({ kind: 'unknown' })
  })

  it('Thai QR payment codes are recognised (we say: open your bank app)', () => {
    const promptPay = '00020101021129370016A000000677010111011300669123456785802TH53037646304ABCD'
    expect(go(promptPay)).toEqual({ kind: 'payment' })
  })

  it('anything else is unknown', () => {
    for (const text of ['', 'hello', '12345', '1234567', 'javascript:alert(1)', 'mailto:a@b.c', 'WIFI:S:home;T:WPA;P:x;;']) {
      expect(go(text)).toEqual({ kind: 'unknown' })
    }
  })
})

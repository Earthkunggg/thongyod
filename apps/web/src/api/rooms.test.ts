import { describe, expect, it } from 'vitest'
import { isRoomCode, roomCodeFrom } from './rooms'

describe('room codes', () => {
  it('accepts 6 digits only', () => {
    expect(isRoomCode('482913')).toBe(true)
    expect(isRoomCode('48291')).toBe(false)
    expect(isRoomCode('48291a')).toBe(false)
  })

  it('reads a code from a link or QR', () => {
    expect(roomCodeFrom(' 482913 ')).toBe('482913')
    expect(roomCodeFrom('https://x.github.io/thongyod/#/games/rooms/482913')).toBe('482913')
    expect(roomCodeFrom('https://thongyod.app/games/rooms/482913?x=1')).toBe('482913')
    expect(roomCodeFrom('https://thongyod.app/games/rooms/4829131')).toBeNull()
    expect(roomCodeFrom('hello')).toBeNull()
  })
})

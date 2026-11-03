import { describe, expect, it } from 'vitest'
import { checkDisplayName } from './validation'

describe('checkDisplayName', () => {
  it('accepts Thai, English, digits, space, dot, underscore, dash', () => {
    expect(checkDisplayName('เอิร์ธ')).toBeNull()
    expect(checkDisplayName('Earth_66 .-')).toBeNull()
  })
  it('trims before checking', () => {
    expect(checkDisplayName('  ต้น  ')).toBeNull()
    expect(checkDisplayName('   ')).toBe('too_short')
  })
  it('enforces 2-20 characters', () => {
    expect(checkDisplayName('a')).toBe('too_short')
    expect(checkDisplayName('a'.repeat(20))).toBeNull()
    expect(checkDisplayName('a'.repeat(21))).toBe('too_long')
  })
  it('rejects emoji and symbols', () => {
    expect(checkDisplayName('earth😀')).toBe('bad_chars')
    expect(checkDisplayName('earth@home')).toBe('bad_chars')
  })
})

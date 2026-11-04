import { describe, expect, it } from 'vitest'
import { crc16, maskTarget, parseTarget, promptPayPayload, targetFromPayload, validNationalId } from './promptpay'

// Reference payloads generated with promptpay-qr 0.5.0 (MIT) on 2026-11-05.
const REF = {
  phoneOpen: '00020101021129370016A000000677010111011300668123456785802TH530376463045D82',
  phone186: '00020101021229370016A000000677010111011300668123456785802TH53037645406186.00630412BE',
  phone350_50: '00020101021229370016A000000677010111011300668123456785802TH53037645406350.50630451CD',
  id220: '00020101021229370016A000000677010111021312345678901235802TH53037645406220.006304CCC4',
  phone0_01: '00020101021229370016A000000677010111011300668999999995802TH530376454040.016304F70A',
}

describe('promptPayPayload matches the reference library', () => {
  it('phone, no amount (static QR)', () => {
    expect(promptPayPayload({ type: 'phone', value: '0812345678' }, null)).toBe(REF.phoneOpen)
  })
  it('phone with amounts in satang', () => {
    expect(promptPayPayload({ type: 'phone', value: '0812345678' }, 18600)).toBe(REF.phone186)
    expect(promptPayPayload({ type: 'phone', value: '0812345678' }, 35050)).toBe(REF.phone350_50)
    expect(promptPayPayload({ type: 'phone', value: '0899999999' }, 1)).toBe(REF.phone0_01)
  })
  it('13-digit ID', () => {
    expect(promptPayPayload({ type: 'nationalId', value: '1234567890123' }, 22000)).toBe(REF.id220)
  })
  it('rejects non-integer or zero amounts', () => {
    expect(() => promptPayPayload({ type: 'phone', value: '0812345678' }, 18.5)).toThrow()
    expect(() => promptPayPayload({ type: 'phone', value: '0812345678' }, 0)).toThrow()
  })
})

describe('crc16', () => {
  it('is CRC-16/CCITT-FALSE', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('parseTarget', () => {
  it('reads phone numbers in common forms', () => {
    for (const raw of ['0812345678', '081-234-5678', '+66 81 234 5678', '(081) 234 5678']) {
      expect(parseTarget(raw)).toEqual({ type: 'phone', value: '0812345678' })
    }
  })
  it('accepts national IDs only with a valid check digit', () => {
    expect(validNationalId('1234567890121')).toBe(true)
    expect(parseTarget('1-2345-67890-12-1')).toEqual({ type: 'nationalId', value: '1234567890121' })
    expect(parseTarget('1234567890123')).toBeNull()
  })
  it('rejects junk', () => {
    for (const raw of ['', 'abc', '12345', '0212345678', '08123456789']) expect(parseTarget(raw)).toBeNull()
  })
})

describe('targetFromPayload (scan a bank QR)', () => {
  it('reads the account back, and refuses a broken CRC or other QR', () => {
    expect(targetFromPayload(REF.phone186)).toEqual({ type: 'phone', value: '0812345678' })
    expect(targetFromPayload(REF.id220)).toEqual({ type: 'nationalId', value: '1234567890123' })
    expect(targetFromPayload(REF.phone186.slice(0, -1) + '0')).toBeNull()
    expect(targetFromPayload('https://example.com')).toBeNull()
  })
})

describe('maskTarget', () => {
  it('hides the middle', () => {
    expect(maskTarget({ type: 'phone', value: '0812345678' })).toBe('081-xxx-5678')
    expect(maskTarget({ type: 'nationalId', value: '1234567890121' })).toBe('x-xxxx-xxxxx-12-1')
  })
})

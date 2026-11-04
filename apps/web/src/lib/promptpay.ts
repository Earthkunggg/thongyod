// PromptPay QR payload (EMVCo merchant-presented QR, Thai PromptPay AID A000000677010111).
// Own implementation; checked in promptpay.test.ts against payloads from promptpay-qr 0.5.0 (MIT, dtinth),
// which was used only as a test reference, not as a dependency. Money is integer satang (spec: deterministic code).

export type PromptPayTarget =
  | { type: 'phone'; value: string } // 0812345678
  | { type: 'nationalId'; value: string } // 13 digits (also tax ID)
  | { type: 'eWallet'; value: string } // 15 digits

const AID = 'A000000677010111'

/** Tag + 2-digit length + value. */
const field = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, '0')}${value}`

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as EMVCo requires. Returns 4 uppercase hex digits. */
export function crc16(text: string): string {
  let crc = 0xffff
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Thai national ID check digit (last digit). */
export function validNationalId(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(id[i]) * (13 - i)
  return (11 - (sum % 11)) % 10 === Number(id[12])
}

/** What the user typed ("081-234-5678", "+66 81 234 5678", "1-2345-67890-12-1") → a target, or null if invalid. */
export function parseTarget(raw: string): PromptPayTarget | null {
  let digits = raw.replace(/[\s\-.()]/g, '')
  if (digits.startsWith('+66')) digits = `0${digits.slice(3)}`
  if (!/^\d+$/.test(digits)) return null
  if (/^0[689]\d{8}$/.test(digits)) return { type: 'phone', value: digits }
  if (digits.length === 13 && validNationalId(digits)) return { type: 'nationalId', value: digits }
  if (digits.length === 15) return { type: 'eWallet', value: digits }
  return null
}

/** The QR text. amountSatang = null → payer types the amount; otherwise the exact amount (dynamic QR). */
export function promptPayPayload(target: PromptPayTarget, amountSatang: number | null): string {
  if (amountSatang !== null && (!Number.isInteger(amountSatang) || amountSatang <= 0)) throw new Error(`amount must be positive whole satang, got ${amountSatang}`)
  const account =
    target.type === 'phone'
      ? field('01', `0066${target.value.slice(1)}`)
      : target.type === 'nationalId'
        ? field('02', target.value)
        : field('03', target.value)
  const amount = amountSatang === null ? '' : field('54', `${Math.floor(amountSatang / 100)}.${String(amountSatang % 100).padStart(2, '0')}`)
  const body = [field('00', '01'), field('01', amountSatang === null ? '11' : '12'), field('29', field('00', AID) + account), field('58', 'TH'), field('53', '764'), amount].join('')
  const withCrcTag = `${body}6304`
  return withCrcTag + crc16(withCrcTag)
}

/** Reads the PromptPay account out of a QR from a banking app (to fill the ID without typing). null = not PromptPay. */
export function targetFromPayload(text: string): PromptPayTarget | null {
  const fields = readFields(text.trim())
  if (!fields || fields.get('63') === undefined) return null
  const crcAt = text.trim().lastIndexOf('6304')
  if (crc16(text.trim().slice(0, crcAt + 4)) !== fields.get('63')?.toUpperCase()) return null
  const merchant = fields.get('29')
  const inner = merchant ? readFields(merchant) : null
  if (!inner || inner.get('00') !== AID) return null
  const phone = inner.get('01')
  if (phone && /^0066\d{9}$/.test(phone)) return { type: 'phone', value: `0${phone.slice(4)}` }
  const id = inner.get('02')
  if (id && /^\d{13}$/.test(id)) return { type: 'nationalId', value: id }
  const wallet = inner.get('03')
  if (wallet && /^\d{15}$/.test(wallet)) return { type: 'eWallet', value: wallet }
  return null
}

function readFields(text: string): Map<string, string> | null {
  const out = new Map<string, string>()
  let i = 0
  while (i < text.length) {
    const tag = text.slice(i, i + 2)
    const len = Number(text.slice(i + 2, i + 4))
    if (!/^\d{2}$/.test(tag) || !Number.isInteger(len) || i + 4 + len > text.length) return null
    out.set(tag, text.slice(i + 4, i + 4 + len))
    i += 4 + len
  }
  return out
}

/** "081-xxx-5678" / "x-xxxx-xxxxx-12-1": enough to recognise, not enough to copy from a screenshot. */
export function maskTarget(target: PromptPayTarget): string {
  const v = target.value
  if (target.type === 'phone') return `${v.slice(0, 3)}-xxx-${v.slice(6)}`
  if (target.type === 'nationalId') return `x-xxxx-xxxxx-${v.slice(10, 12)}-${v.slice(12)}`
  return `${'x'.repeat(11)}${v.slice(11)}`
}

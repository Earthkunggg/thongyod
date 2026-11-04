/** Short random id for data kept on this device. Works on plain http too (crypto.randomUUID needs https). */
export function randomId(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

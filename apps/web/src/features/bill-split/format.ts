/** Satang → plain number text for an input field: 9000 → "90", 8950 → "89.50". */
export function formatBahtPlain(satang: number): string {
  return satang % 100 === 0 ? String(satang / 100) : (satang / 100).toFixed(2)
}

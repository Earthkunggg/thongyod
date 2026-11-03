// Money is stored as integer satang (1 baht = 100 satang). Format only for display.
import i18n, { intlLocale } from '@/i18n'

/** 18600 -> "186 บาท" (th) / "฿186" (en); 18650 -> "186.50 บาท" */
export function formatBaht(satang: number): string {
  if (!Number.isInteger(satang)) throw new Error(`satang must be an integer, got ${satang}`)
  const hasSatang = satang % 100 !== 0
  const amount = new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: hasSatang ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(satang / 100)
  return i18n.t('money.baht', { amount })
}

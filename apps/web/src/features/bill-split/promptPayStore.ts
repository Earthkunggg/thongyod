// PromptPay numbers remembered on this device, by person name (people repeat across bills).
// Only on this phone; never sent anywhere. Spec §9.1: warn when a national ID is used.
import { parseTarget, type PromptPayTarget } from '@/lib/promptpay'

const KEY = 'thongyod-promptpay'
const nameKey = (name: string) => name.trim().toLowerCase()

function readAll(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return value && typeof value === 'object' ? (value as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function loadPromptPay(name: string): PromptPayTarget | null {
  const raw = readAll()[nameKey(name)]
  return typeof raw === 'string' ? parseTarget(raw) : null
}

export function savePromptPay(name: string, target: PromptPayTarget | null): void {
  const all = readAll()
  if (target) all[nameKey(name)] = target.value
  else delete all[nameKey(name)]
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // Storage blocked: the QR still works for this visit.
  }
}

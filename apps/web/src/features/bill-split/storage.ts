// Keeps the bill being split on this device, so closing the app by mistake loses nothing.
import { isBillDraft, type BillDraft } from './draft'

const KEY = 'thongyod-bill'

export function loadDraft(): BillDraft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isBillDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveDraft(draft: BillDraft | null): void {
  try {
    if (draft) localStorage.setItem(KEY, JSON.stringify(draft))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked (private mode): the bill still works, it just is not kept.
  }
}

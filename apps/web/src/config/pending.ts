import { CheckSquare, Receipt, Utensils, type LucideIcon } from 'lucide-react'
import type { PendingKind } from '@thongyod/shared'

/** Icon for each "ต้องจัดการ" item kind (Home row and /pending). */
export const PENDING_ICONS: Record<PendingKind, LucideIcon> = {
  vote_time: CheckSquare,
  vote_restaurant: Utensils,
  pay_bill: Receipt,
  confirm_payment: Receipt,
}

import { useTranslation } from 'react-i18next'
import type { Bill } from './bill'

/** Display name, with a fallback for an empty name. */
export function usePersonName(bill: Bill) {
  const { t } = useTranslation()
  return (id: string) => {
    const i = bill.people.findIndex((p) => p.id === id)
    return bill.people[i]?.name.trim() || t('billSplit.personN', { n: i + 1 })
  }
}

import { useTranslation } from 'react-i18next'
import type { Restaurant } from './logic'

/** "ตามสั่ง · ≤ 60 บาท/คน · ไปมาแล้ว 2 ครั้ง" (price always says where it comes from, spec §8.3). */
export function useRestaurantSubtitle() {
  const { t } = useTranslation()
  return (r: Restaurant) =>
    [
      t(`restaurants.categories.${r.category}`),
      r.budget ? `${t(`restaurants.budgets.${r.budget}`)} ${t('restaurants.budgetUnit')}` : t('restaurants.priceUnknown'),
      r.visits > 0 ? t('restaurants.visits', { count: r.visits }) : t('restaurants.notVisited'),
    ].join(' · ')
}

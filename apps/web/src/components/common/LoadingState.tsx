import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'

// Placeholder rows while a list or card loads. `rows` = how many grey rows.
export function LoadingState({ rows = 3 }: { rows?: number }) {
  const { t } = useTranslation()
  return (
    <div role="status" aria-label={t('common.loading')} className="flex flex-col gap-3 px-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}

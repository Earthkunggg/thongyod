import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Shown when loading fails. `onRetry` usually = query.refetch.
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <Card role="alert" className="mx-3 flex flex-col items-center gap-1 p-4 text-center">
      <p className="text-sm font-medium">{t('common.loadError')}</p>
      <p className="text-xs text-muted-foreground">{t('common.loadErrorHint')}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </Card>
  )
}

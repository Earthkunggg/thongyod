import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useHome } from '@/api/home'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { PENDING_ICONS } from '@/config/pending'
import { pendingSubtitle, pendingTitle } from '@/lib/describe'

// /pending — every "ต้องจัดการ" item (Home shows them as a sideways row).
export function PendingPage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const home = useHome()
  const items = home.data?.pending ?? []

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader title={t('home.pendingPage')} backTo="/" />
      {home.isPending ? (
        <LoadingState rows={4} />
      ) : home.isError ? (
        <ErrorState onRetry={() => void home.refetch()} />
      ) : (
        <Card className="mx-3 px-4 py-1">
          {items.length === 0 ? (
            <EmptyState title={t('home.pendingEmpty')} />
          ) : (
            items.map((item) => (
              <ListRow key={item.id} leading={<IconTile icon={PENDING_ICONS[item.kind]} />} title={pendingTitle(item)} subtitle={pendingSubtitle(item, now)} />
            ))
          )}
        </Card>
      )}
    </div>
  )
}

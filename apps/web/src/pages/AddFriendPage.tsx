import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { useFriendLinkOwner } from '@/api/friends'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PersonCardRow } from '@/components/friends/PersonCardRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'

// /add/:code — opened from a friend QR or a link shared in LINE. Shows who it is + add button.
export function AddFriendPage() {
  const { t } = useTranslation()
  const { code = '' } = useParams()
  const owner = useFriendLinkOwner(code)
  const invalid = owner.error instanceof ApiError && owner.error.status === 404

  return (
    <div className="flex flex-col gap-3 pb-6">
      <PageHeader title={t('friends.link.title')} backTo="/gangs/friends" />
      {owner.isPending ? (
        <LoadingState rows={1} />
      ) : invalid ? (
        <Card className="mx-3">
          <EmptyState title={t('friends.link.invalid')} hint={t('friends.link.invalidHint')} />
        </Card>
      ) : owner.isError ? (
        <ErrorState onRetry={() => void owner.refetch()} />
      ) : (
        <Card className="mx-3 px-4 py-1">
          <PersonCardRow user={owner.data} />
        </Card>
      )}
    </div>
  )
}

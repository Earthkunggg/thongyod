import { useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ApiError } from '@/api/client'
import { useProfile } from '@/api/profile'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { FriendActionButton } from '@/components/friends/FriendActionButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileView } from '@/components/profile/ProfileView'

// /u/:userId — another person's profile (same view as mine, different buttons).
export function UserProfilePage() {
  const { t } = useTranslation()
  const { userId = '' } = useParams()
  const profile = useProfile(userId)
  const notFound = profile.error instanceof ApiError && profile.error.status === 404

  return (
    <>
      <PageHeader title={profile.data?.displayName ?? t('profile.title')} backTo="/gangs/friends" />
      {profile.isPending ? (
        <LoadingState rows={3} />
      ) : notFound ? (
        <EmptyState title={t('profile.notFound')} />
      ) : profile.isError ? (
        <ErrorState onRetry={() => void profile.refetch()} />
      ) : (
        <ProfileView profile={profile.data} actions={<FriendActionButton user={profile.data} />} />
      )}
    </>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Ban, CalendarPlus, MoreHorizontal, UserMinus } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useBlockUser, useUnfriend } from '@/api/friends'
import { useProfile } from '@/api/profile'
import type { Profile } from '@/api/types'
import { ActionSheet, type SheetAction } from '@/components/common/ActionSheet'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { FriendActionButton } from '@/components/friends/FriendActionButton'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileView } from '@/components/profile/ProfileView'
import { Button, buttonVariants } from '@/components/ui/button'
import { showErrorToast, toastManager } from '@/lib/toast'

// /u/:userId — another person's profile (decision #44).
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
        <ProfileView profile={profile.data} actions={<ProfileActions profile={profile.data} />} />
      )}
    </>
  )
}

/** Friends: ชวนนัด (if we share a gang) + ⋯ (unfriend, block). Others: add/accept + ⋯ (block). */
function ProfileActions({ profile }: { profile: Profile }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const unfriend = useUnfriend()
  const block = useBlockUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirm, setConfirm] = useState<'unfriend' | 'block' | null>(null)
  const isFriend = profile.relationship === 'friend'
  const name = profile.displayName

  const sheet: SheetAction[] = [
    ...(isFriend ? [{ key: 'unfriend', label: t('profile.unfriend'), icon: UserMinus, onSelect: () => setConfirm('unfriend') }] : []),
    { key: 'block', label: t('profile.block'), icon: Ban, destructive: true, onSelect: () => setConfirm('block') },
  ]

  return (
    <>
      {isFriend ? (
        profile.sharedGangs.length > 0 && (
          <Link to={`/meetups/new?with=${encodeURIComponent(profile.userId)}`} className={buttonVariants({ size: 'sm' })}>
            <CalendarPlus aria-hidden="true" />
            {t('profile.invite')}
          </Link>
        )
      ) : (
        <FriendActionButton user={profile} />
      )}
      <Button variant="outline" size="icon-sm" className="bg-card" aria-label={t('profile.more')} onClick={() => setMenuOpen(true)}>
        <MoreHorizontal />
      </Button>

      <ActionSheet open={menuOpen} onOpenChange={setMenuOpen} title={name} actions={sheet} />
      <ConfirmDialog
        open={confirm === 'unfriend'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t('profile.unfriendTitle', { name })}
        description={t('profile.unfriendText')}
        confirmLabel={t('profile.unfriend')}
        onConfirm={() =>
          unfriend.mutate(profile.userId, {
            onSuccess: () => toastManager.add({ title: t('profile.unfriended', { name }) }),
            onError: () => showErrorToast(t('common.saveError')),
          })
        }
      />
      <ConfirmDialog
        open={confirm === 'block'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t('profile.blockTitle', { name })}
        description={t('profile.blockText')}
        confirmLabel={t('profile.block')}
        destructive
        onConfirm={() =>
          block.mutate(profile.userId, {
            onSuccess: () => {
              toastManager.add({ title: t('profile.blocked', { name }) })
              void navigate('/gangs/friends', { replace: true })
            },
            onError: () => showErrorToast(t('common.saveError')),
          })
        }
      />
    </>
  )
}

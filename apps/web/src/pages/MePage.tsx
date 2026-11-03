import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Pencil, QrCode, Settings } from 'lucide-react'
import { useProfile } from '@/api/profile'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProfileView } from '@/components/profile/ProfileView'
import { buttonVariants } from '@/components/ui/button'

// Tab "ฉัน": my profile. Settings live behind the gear icon (decision #36).
export function MePage() {
  const { t } = useTranslation()
  const profile = useProfile('me')

  return (
    <>
      <PageHeader
        title={t('pages.me.title')}
        action={
          <Link to="/settings" aria-label={t('settings.title')} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
            <Settings />
          </Link>
        }
      />
      {profile.isPending ? (
        <LoadingState rows={3} />
      ) : profile.isError ? (
        <ErrorState onRetry={() => void profile.refetch()} />
      ) : (
        <ProfileView
          profile={profile.data}
          actions={
            <>
              <Link to="/me/edit" className={buttonVariants({ size: 'sm' })}>
                <Pencil aria-hidden="true" />
                {t('profile.edit')}
              </Link>
              <Link to="/friends/qr" className={buttonVariants({ size: 'sm', variant: 'outline', className: 'bg-card' })}>
                <QrCode aria-hidden="true" />
                {t('friends.myQr')}
              </Link>
            </>
          }
        />
      )}
    </>
  )
}

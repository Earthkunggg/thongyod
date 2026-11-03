import { Link, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubTabs } from '@/components/layout/SubTabs'
import { buttonVariants } from '@/components/ui/button'

// Tab "แก๊ง": header + sub-tabs แก๊ง | เพื่อน (decision #34). Each sub-tab is its own URL.
export function GangsLayout() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader
        title={t('pages.gangs.title')}
        action={
          <Link to="/friends/qr" aria-label={t('friends.addFriend')} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
            <UserPlus />
          </Link>
        }
      />
      <SubTabs
        label={t('friends.tabsLabel')}
        tabs={[
          { to: '/gangs', label: t('friends.tabGangs') },
          { to: '/gangs/friends', label: t('friends.tabFriends') },
        ]}
      />
      <Outlet />
    </>
  )
}

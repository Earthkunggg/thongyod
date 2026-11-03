import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('pages.notFound.title')} subtitle={t('pages.notFound.subtitle')} />
      <div className="px-4 pt-2">
        <Link to="/" className={buttonVariants()}>
          {t('common.backHome')}
        </Link>
      </div>
    </>
  )
}

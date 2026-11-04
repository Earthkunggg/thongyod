import { useEffect } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  // A client-side "not found" still returns HTTP 200: tell search engines not to index it (Google's SPA advice).
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <>
      <PageHeader title={t('pages.notFound.title')} subtitle={t('pages.notFound.subtitle')} backTo="/" />
      <div className="px-4 pt-2">
        <Link to="/" className={buttonVariants()}>
          {t('common.backHome')}
        </Link>
      </div>
    </>
  )
}

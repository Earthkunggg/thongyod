import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Placeholder } from '@/components/layout/Placeholder'

export function ExplorePage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('pages.explore.title')} subtitle={t('pages.explore.subtitle')} />
      <Placeholder text={t('pages.explore.placeholder')} />
    </>
  )
}

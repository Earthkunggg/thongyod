import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Placeholder } from '@/components/layout/Placeholder'

export function GangsPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('pages.gangs.title')} />
      <Placeholder text={t('pages.gangs.placeholder')} />
    </>
  )
}

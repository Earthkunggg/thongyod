import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Placeholder } from '@/components/layout/Placeholder'

export function PetPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('pages.pet.title')} />
      <Placeholder text={t('pages.pet.placeholder')} />
    </>
  )
}

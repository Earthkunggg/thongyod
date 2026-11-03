import { useTranslation } from 'react-i18next'
import { Placeholder } from '@/components/layout/Placeholder'

// Sub-tab "แก๊ง" (inside GangsLayout). Gang list comes in M1.
export function GangsPage() {
  const { t } = useTranslation()
  return <Placeholder text={t('pages.gangs.placeholder')} />
}

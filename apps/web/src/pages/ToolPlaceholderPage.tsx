import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Placeholder } from '@/components/layout/Placeholder'
import type { ToolId } from '@/config/tools'

// Temporary page for a tool that is planned but not built yet.
export function ToolPlaceholderPage({ toolId }: { toolId: ToolId }) {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t(`tools.${toolId}.title`)} backTo="/explore" />
      <Placeholder text={t('common.underConstruction')} />
    </>
  )
}

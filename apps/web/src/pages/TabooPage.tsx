import { useTranslation } from 'react-i18next'
import { SoundToggle } from '@/components/common/SoundToggle'
import { PageHeader } from '@/components/layout/PageHeader'
import { TabooGame } from '@/features/taboo/TabooGame'

// /games/taboo — คำต้องห้าม
export function TabooPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.taboo.title')} subtitle={t('games.list.taboo.desc')} backTo="/games" action={<SoundToggle game="taboo" />} />
      <TabooGame />
    </>
  )
}

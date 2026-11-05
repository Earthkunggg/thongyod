import { useTranslation } from 'react-i18next'
import { GameHeaderActions } from '@/components/games/HowToPlay'
import { PageHeader } from '@/components/layout/PageHeader'
import { TabooGame } from '@/features/taboo/TabooGame'

// /games/taboo — คำต้องห้าม
export function TabooPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.taboo.title')} subtitle={t('games.list.taboo.desc')} backTo="/games" action={<GameHeaderActions game="taboo" />} />
      <TabooGame />
    </>
  )
}

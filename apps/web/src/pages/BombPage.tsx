import { useTranslation } from 'react-i18next'
import { GameHeaderActions } from '@/components/games/HowToPlay'
import { PageHeader } from '@/components/layout/PageHeader'
import { BombGame } from '@/features/bomb/BombGame'

// /games/bomb — ระเบิดเวลา
export function BombPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.bomb.title')} subtitle={t('games.list.bomb.desc')} backTo="/games" action={<GameHeaderActions game="bomb" />} />
      <BombGame />
    </>
  )
}

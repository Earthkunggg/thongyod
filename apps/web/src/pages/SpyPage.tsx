import { useTranslation } from 'react-i18next'
import { GameHeaderActions } from '@/components/games/HowToPlay'
import { PageHeader } from '@/components/layout/PageHeader'
import { SpyGame } from '@/features/spy/SpyGame'

// /games/spy — สายลับ
export function SpyPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.spy.title')} subtitle={t('games.list.spy.desc')} backTo="/games" action={<GameHeaderActions game="spy" />} />
      <SpyGame />
    </>
  )
}

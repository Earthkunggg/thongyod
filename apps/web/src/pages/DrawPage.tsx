import { useTranslation } from 'react-i18next'
import { SoundToggle } from '@/components/common/SoundToggle'
import { PageHeader } from '@/components/layout/PageHeader'
import { DrawGame } from '@/features/draw/DrawGame'

// /games/draw — วาดแล้วทาย
export function DrawPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.draw.title')} subtitle={t('games.list.draw.desc')} backTo="/games" action={<SoundToggle game="draw" />} />
      <DrawGame />
    </>
  )
}

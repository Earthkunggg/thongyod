import { useTranslation } from 'react-i18next'
import { SoundToggle } from '@/components/common/SoundToggle'
import { PageHeader } from '@/components/layout/PageHeader'
import { CupsGame } from '@/features/cups/CupsGame'

// /games/cups — ขนมอยู่ไหน
export function CupsPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.cups.title')} subtitle={t('games.list.cups.desc')} backTo="/games" action={<SoundToggle game="cups" />} />
      <CupsGame />
    </>
  )
}

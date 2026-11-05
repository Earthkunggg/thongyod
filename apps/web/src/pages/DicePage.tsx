import { useTranslation } from 'react-i18next'
import { SoundToggle } from '@/components/common/SoundToggle'
import { PageHeader } from '@/components/layout/PageHeader'
import { DiceBottleGame } from '@/features/dice/DiceBottleGame'

// /games/dice — ลูกเต๋า & ปั่นขวด
export function DicePage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.dice.title')} subtitle={t('games.list.dice.desc')} backTo="/games" action={<SoundToggle game="dice" />} />
      <DiceBottleGame />
    </>
  )
}

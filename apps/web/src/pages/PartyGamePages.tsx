import { useTranslation } from 'react-i18next'
import { GameHeaderActions } from '@/components/games/HowToPlay'
import { PageHeader } from '@/components/layout/PageHeader'
import { MOST_LIKELY, NEVER_HAVE } from '@/config/games/party'
import { PartyDeckGame } from '@/features/party/PartyDeckGame'

// /games/most-likely — ใครน่าจะ…
export function MostLikelyPage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.mostLikely.title')} subtitle={t('games.list.mostLikely.desc')} backTo="/games" action={<GameHeaderActions game="mostLikely" />} />
      <PartyDeckGame game="mostLikely" packs={MOST_LIKELY} />
    </>
  )
}

// /games/never — ไม่เคย…
export function NeverHavePage() {
  const { t } = useTranslation()
  return (
    <>
      <PageHeader title={t('games.list.neverHave.title')} subtitle={t('games.list.neverHave.desc')} backTo="/games" action={<GameHeaderActions game="neverHave" />} />
      <PartyDeckGame game="neverHave" packs={NEVER_HAVE} />
    </>
  )
}

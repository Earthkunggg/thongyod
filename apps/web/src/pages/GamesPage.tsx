import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/components/common/SectionHeader'
import { GameTile } from '@/components/games/GameTile'
import { PageHeader } from '@/components/layout/PageHeader'
import { GAMES, type GameMode } from '@/config/games'

const SECTIONS: GameMode[] = ['onePhone', 'solo']

// /games — every game, by how it is played. Ready games first in each section.
export function GamesPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 pb-8">
      <PageHeader title={t('games.title')} subtitle={t('games.subtitle')} backTo="/explore" />
      {SECTIONS.map((mode) => {
        const list = GAMES.filter((g) => g.mode === mode).sort((a, b) => Number(a.status === 'soon') - Number(b.status === 'soon'))
        return (
          <section key={mode}>
            <SectionHeader title={t(`games.modes.${mode}`)} />
            <div className="grid grid-cols-2 gap-2 px-3">
              {list.map((g) => (
                <GameTile key={g.id} game={g} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Wifi } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { GameTile } from '@/components/games/GameTile'
import { PageHeader } from '@/components/layout/PageHeader'
import { GAMES, type GameMode } from '@/config/games'
import { SHOW_BACK } from '@/lib/nav'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

const SECTIONS: GameMode[] = ['onePhone', 'solo']

// /games — every game, by how it is played. Ready games first in each section.
export function GamesPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 pb-8">
      <PageHeader title={t('games.title')} subtitle={t('games.subtitle')} backTo="/explore" />
      <Link to="/games/rooms" state={SHOW_BACK} className={cn('mx-3 flex items-center gap-3 rounded-3xl p-4 active:scale-[0.99]', tintClass(5))}>
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background/60">
          <Wifi className="size-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{t('games.roomsBanner.title')}</span>
          <span className="block text-xs opacity-80">{t('games.roomsBanner.text')}</span>
        </span>
        <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
      </Link>
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

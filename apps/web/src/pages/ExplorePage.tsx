import { useTranslation } from 'react-i18next'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FeaturedAction } from '@/components/explore/FeaturedAction'
import { ToolTile } from '@/components/explore/ToolTile'
import { PageHeader } from '@/components/layout/PageHeader'
import { TOOLS, type Tool } from '@/config/tools'
import { SeeAllLink } from '@/components/common/SeeAllLink'
import { GameTile } from '@/components/games/GameTile'
import { GAMES } from '@/config/games'

/** Games shown on Explore; the rest are on /games. */
const GAME_PREVIEW = 4

function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <div className="stagger grid grid-cols-2 gap-2 px-3">
      {tools.map((tool) => (
        <ToolTile key={tool.id} tool={tool} />
      ))}
    </div>
  )
}

export function ExplorePage() {
  const { t } = useTranslation()
  const ready = TOOLS.filter((tool) => tool.status === 'ready')
  const featured = ready.filter((tool) => tool.featured)
  const friends = ready.filter((tool) => tool.group === 'friends' && !tool.featured)
  const solo = ready.filter((tool) => tool.group === 'solo' && !tool.featured)
  const soon = TOOLS.filter((tool) => tool.status === 'soon')

  return (
    <div className="flex flex-col gap-2 pb-4">
      <PageHeader title={t('pages.explore.title')} subtitle={t('pages.explore.subtitle')} />

      <section>
        <SectionHeader title={t('explore.withFriends')} />
        <div className="flex flex-col gap-2">
          {featured.map((tool) => (
            <div key={tool.id} className="px-3">
              <FeaturedAction tool={tool} />
            </div>
          ))}
          <ToolGrid tools={friends} />
        </div>
      </section>

      <section>
        <SectionHeader title={t('games.title')} action={<SeeAllLink to="/games" />} />
        <div className="stagger grid grid-cols-2 gap-2 px-3">
          {GAMES.filter((g) => g.status === 'ready')
            .slice(0, GAME_PREVIEW)
            .map((g) => (
              <GameTile key={g.id} game={g} />
            ))}
        </div>
      </section>

      <section>
        <SectionHeader title={t('explore.solo')} />
        <ToolGrid tools={solo} />
      </section>

      {soon.length > 0 && (
        <section>
          <SectionHeader title={t('explore.soon')} />
          <ToolGrid tools={soon} />
        </section>
      )}
    </div>
  )
}

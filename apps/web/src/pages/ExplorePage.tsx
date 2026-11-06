import { useTranslation } from 'react-i18next'
import { Gamepad2 } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { SectionHeader } from '@/components/common/SectionHeader'
import { FeaturedAction } from '@/components/explore/FeaturedAction'
import { ToolRow } from '@/components/explore/ToolRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { GAMES } from '@/config/games'
import { TOOLS, type Tool } from '@/config/tools'

function ToolList({ tools }: { tools: Tool[] }) {
  return (
    <Card className="mx-3 px-4 py-1">
      {tools.map((tool) => (
        <ToolRow key={tool.id} tool={tool} />
      ))}
    </Card>
  )
}

// ทำอะไรดี (#84): one highlighted action, then plain lists. Games are one row into /games instead of a
// second grid of coloured tiles, so there is one way in to each thing.
export function ExplorePage() {
  const { t } = useTranslation()
  const ready = TOOLS.filter((tool) => tool.status === 'ready')
  const featured = ready.filter((tool) => tool.featured)
  const friends = ready.filter((tool) => tool.group === 'friends' && !tool.featured)
  const solo = ready.filter((tool) => tool.group === 'solo' && !tool.featured)
  const soon = TOOLS.filter((tool) => tool.status === 'soon')
  const games = GAMES.filter((g) => g.status === 'ready')

  return (
    <div className="flex flex-col gap-2 pb-4">
      <PageHeader title={t('pages.explore.title')} subtitle={t('pages.explore.subtitle')} />

      <section className="flex flex-col gap-2">
        <SectionHeader title={t('explore.withFriends')} />
        {featured.map((tool) => (
          <div key={tool.id} className="px-3">
            <FeaturedAction tool={tool} />
          </div>
        ))}
        <ToolList tools={friends} />
      </section>

      <section>
        <SectionHeader title={t('games.title')} />
        <Card className="mx-3 px-4 py-1">
          <ListRow
            to="/games"
            leading={<IconTile icon={Gamepad2} />}
            title={t('explore.gamesRow', { count: games.length })}
            subtitle={t('explore.gamesRowHint', {
              names: games
                .slice(0, 3)
                .map((g) => t(`games.list.${g.id}.title`))
                .join(' · '),
            })}
          />
        </Card>
      </section>

      <section>
        <SectionHeader title={t('explore.solo')} />
        <ToolList tools={solo} />
      </section>

      {soon.length > 0 && (
        <section>
          <SectionHeader title={t('explore.soon')} />
          <ToolList tools={soon} />
        </section>
      )}
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import type { Tool } from '@/config/tools'
import { SHOW_BACK } from '@/lib/nav'

// One tool on the Explore page, as a row in a list card (#84; was a 2-column tile).
// Group tools use the accent tone, solo tools neutral. 'soon' tools show a lock and are not tappable.
export function ToolRow({ tool }: { tool: Tool }) {
  const { t } = useTranslation()
  const title = t(`tools.${tool.id}.title`)
  const desc = t(`tools.${tool.id}.desc`)
  const tone = tool.group === 'friends' ? 'accent' : 'neutral'

  if (tool.status === 'soon' || !tool.to) {
    return (
      <ListRow
        leading={<IconTile icon={tool.icon} tone="neutral" />}
        title={title}
        subtitle={desc}
        trailing={<Lock className="size-4 text-muted-foreground" aria-hidden="true" />}
      />
    )
  }
  return <ListRow to={tool.to} linkState={SHOW_BACK} leading={<IconTile icon={tool.icon} tone={tone} />} title={title} subtitle={desc} />
}

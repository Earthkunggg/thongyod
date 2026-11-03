import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Lock } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import type { Tool } from '@/config/tools'
import { cn } from '@/lib/utils'

// One tool card on the Explore page. Group tools use the accent tone, solo tools neutral.
// 'soon' tools are locked: dashed border, lock icon, not tappable.
export function ToolTile({ tool }: { tool: Tool }) {
  const { t } = useTranslation()
  const title = t(`tools.${tool.id}.title`)
  const desc = t(`tools.${tool.id}.desc`)

  if (tool.status === 'soon' || !tool.to) {
    return (
      <div
        aria-label={title + t('explore.lockedSuffix')}
        className="flex min-h-28 flex-col gap-1.5 rounded-xl border border-dashed bg-muted/50 p-3 text-muted-foreground"
      >
        <div className="flex items-start justify-between">
          <tool.icon className="size-5" aria-hidden="true" />
          <Lock className="size-4" aria-hidden="true" />
        </div>
        <span className="text-sm">{title}</span>
        <span className="text-xs">{desc}</span>
      </div>
    )
  }

  return (
    <Link
      to={tool.to}
      className={cn(
        'flex min-h-28 flex-col gap-1.5 rounded-xl border bg-card p-3 text-card-foreground',
        'transition-transform active:scale-[0.98]',
      )}
    >
      <IconTile icon={tool.icon} tone={tool.group === 'friends' ? 'accent' : 'neutral'} />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{desc}</span>
    </Link>
  )
}

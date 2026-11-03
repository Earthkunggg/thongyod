import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ListRowProps = {
  /** Left side: usually an <IconTile> or <Avatar>. */
  leading?: ReactNode
  title: string
  subtitle?: string
  /** When set, the whole row is a link and shows a chevron. */
  to?: string
  /** Right side: e.g. buttons. Do not combine with `to` (no buttons inside links). */
  trailing?: ReactNode
}

// One row inside a list card. Rows separate themselves with a top border.
export function ListRow({ leading, title, subtitle, to, trailing }: ListRowProps) {
  const content = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
      {to && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
    </>
  )
  const classes = cn('flex min-h-14 items-center gap-3 py-2 [&+&]:border-t')

  return to ? (
    <Link to={to} className={cn(classes, 'active:opacity-70')}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}

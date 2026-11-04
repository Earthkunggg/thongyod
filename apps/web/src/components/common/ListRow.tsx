import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type ListRowProps = {
  /** Left side: usually an <IconTile> or <Avatar>. */
  leading?: ReactNode
  title: string
  subtitle?: string
  /** Link target. Without `trailing` the whole row is a link with a chevron;
   *  with `trailing` only the left part (leading + text) is the link. */
  to?: string
  /** Right side: e.g. buttons. Never inside the link. */
  trailing?: ReactNode
}

// One row inside a list card. Rows separate themselves with a top border.
export function ListRow({ leading, title, subtitle, to, trailing }: ListRowProps) {
  const main = (
    <>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
    </>
  )
  const row = 'flex min-h-14 items-center gap-3 py-2 [&+&]:border-t'

  if (to && !trailing) {
    return (
      <Link to={to} className={cn(row, 'active:opacity-70')}>
        {main}
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    )
  }
  return (
    <div className={row}>
      {to ? (
        <Link to={to} className="flex min-w-0 flex-1 items-center gap-3 active:opacity-70">
          {main}
        </Link>
      ) : (
        main
      )}
      {trailing && <span className="flex shrink-0 items-center gap-2">{trailing}</span>}
    </div>
  )
}

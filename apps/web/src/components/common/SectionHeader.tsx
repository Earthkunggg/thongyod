import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  /** Optional element on the right, e.g. a "ดูทั้งหมด" link. */
  action?: ReactNode
  /** Quieter text: a sub-heading (h3) inside a bigger zone (Home). */
  muted?: boolean
}

// Small heading above a group of cards on a page.
export function SectionHeader({ title, action, muted = false }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
      {muted ? <h3 className="text-sm text-muted-foreground">{title}</h3> : <h2 className="text-sm font-medium">{title}</h2>}
      {action}
    </div>
  )
}

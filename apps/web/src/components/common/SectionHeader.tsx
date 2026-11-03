import type { ReactNode } from 'react'

type SectionHeaderProps = {
  title: string
  /** Optional element on the right, e.g. a "ดูทั้งหมด" link. */
  action?: ReactNode
}

// Small heading above a group of cards on a page.
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1.5">
      <h2 className="text-sm font-medium">{title}</h2>
      {action}
    </div>
  )
}

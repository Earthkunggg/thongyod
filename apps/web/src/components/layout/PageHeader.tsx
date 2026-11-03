import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Optional element on the right, e.g. a bell icon button. */
  action?: ReactNode
}

// Standard page title block. Use on every tab page instead of a custom <h1>.
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-medium">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

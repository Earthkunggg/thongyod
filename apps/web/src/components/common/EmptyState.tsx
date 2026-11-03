import type { ReactNode } from 'react'

// "Nothing here" message, e.g. a day without meetups. Put it inside a Card or page.
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-5 text-center">
      <p className="text-sm text-muted-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

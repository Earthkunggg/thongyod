import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { wantsBack } from '@/lib/nav'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Optional element on the right, e.g. a bell icon button. */
  action?: ReactNode
  /** Show a back button. The value is where to go if there is no page to go back to. */
  backTo?: string
}

// Standard page title block. Use on every page instead of a custom <h1>.
// Sticky: the back button stays reachable on long pages (an installed app has no browser back button).
export function PageHeader({ title, subtitle, action, backTo }: PageHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  // Sub-pages always have a back button; tab pages only when another page linked to them.
  const showBack = Boolean(backTo) || wantsBack(location.state)

  function goBack() {
    // 'default' = this page was opened directly (e.g. from a shared link): no history to go back to.
    if (location.key !== 'default') void navigate(-1)
    else void navigate(backTo ?? '/')
  }

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-2 bg-background/90 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-2 backdrop-blur">
      {showBack && (
        <Button variant="ghost" size="icon" className="-ml-3" aria-label={t('common.back')} onClick={goBack}>
          <ChevronLeft className="size-6" />
        </Button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-medium">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}

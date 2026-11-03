import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type PageHeaderProps = {
  title: string
  subtitle?: string
  /** Optional element on the right, e.g. a bell icon button. */
  action?: ReactNode
  /** Show a back button. The value is where to go if there is no page to go back to. */
  backTo?: string
}

// Standard page title block. Use on every page instead of a custom <h1>.
export function PageHeader({ title, subtitle, action, backTo }: PageHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  function goBack() {
    // 'default' = this page was opened directly (e.g. from a shared link): no history to go back to.
    if (location.key !== 'default') void navigate(-1)
    else if (backTo) void navigate(backTo)
  }

  return (
    <header className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
      {backTo && (
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

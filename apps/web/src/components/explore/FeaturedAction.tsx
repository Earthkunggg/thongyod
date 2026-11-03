import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'
import type { Tool } from '@/config/tools'

// Big highlighted card for the main action of a group (e.g. "ชวนนัด").
export function FeaturedAction({ tool }: { tool: Tool }) {
  const { t } = useTranslation()
  if (!tool.to) return null
  return (
    <Link
      to={tool.to}
      className="flex items-center gap-3 rounded-xl border border-primary bg-accent p-3 text-accent-foreground transition-transform active:scale-[0.98]"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
      >
        <tool.icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium">{t(`tools.${tool.id}.title`)}</span>
        <span className="block text-xs">{t(`tools.${tool.id}.desc`)}</span>
      </span>
      <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
    </Link>
  )
}

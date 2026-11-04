import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react'

// "ดูทั้งหมด ›" link for the right side of a SectionHeader. One look everywhere a section is cut short.
export function SeeAllLink({ to, label }: { to: string; /** Overrides "ดูทั้งหมด", e.g. "ปฏิทิน". */ label?: string }) {
  const { t } = useTranslation()
  return (
    <Link to={to} className="-my-2 flex min-h-9 items-center text-xs font-medium text-primary">
      {label ?? t('common.seeAll')}
      <ChevronRight className="size-3.5" aria-hidden="true" />
    </Link>
  )
}

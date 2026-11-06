import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, LayoutGrid, Receipt, Utensils, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SHOW_BACK } from '@/lib/nav'
import { tintClass } from '@/lib/tones'

type Tile = { key: string; to: string; icon: LucideIcon; label: string; tone: string }

// Shortcuts zone of Home: one row of the 4 most used things (DECISIONS #54, cut from 8 to 4 in #83).
export function QuickTools() {
  const { t } = useTranslation()
  const tiles: Tile[] = [
    { key: 'meet', to: '/meetups/new', icon: CalendarPlus, label: t('tools.createMeetup.title'), tone: tintClass(1) },
    { key: 'bill', to: '/bills', icon: Receipt, label: t('tools.splitBill.title'), tone: tintClass(2) },
    { key: 'eat', to: '/wheel?preset=food', icon: Utensils, label: t('home.tools.eat'), tone: tintClass(6) },
    { key: 'all', to: '/explore', icon: LayoutGrid, label: t('home.tools.all'), tone: 'bg-muted text-muted-foreground' },
  ]
  return (
    <nav aria-label={t('home.toolsTitle')} className="grid grid-cols-4 gap-x-1 px-3">
      {tiles.map(({ key, to, icon: Icon, label, tone }) => (
        <Link key={key} to={to} state={SHOW_BACK} className="flex flex-col items-center gap-1.5 rounded-xl py-1 active:scale-95">
          <span className={cn('grid size-12 place-items-center rounded-2xl', tone)}>
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <span className="w-full truncate text-center text-xs">{label}</span>
        </Link>
      ))}
    </nav>
  )
}

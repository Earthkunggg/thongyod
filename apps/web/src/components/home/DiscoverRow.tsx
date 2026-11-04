import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CheckSquare, LoaderPinwheel, Receipt, Smartphone, type LucideIcon } from 'lucide-react'
import { HScroll } from '@/components/common/HScroll'
import { SectionHeader } from '@/components/common/SectionHeader'
import { cn } from '@/lib/utils'
import { tintClass } from '@/lib/tones'

type Item = { key: 'whoPays' | 'jot' | 'vote' | 'headsUp'; to: string; icon: LucideIcon; tone: string; soon?: boolean }

const ITEMS: Item[] = [
  { key: 'whoPays', to: '/wheel?preset=whoPays', icon: LoaderPinwheel, tone: tintClass(3) },
  { key: 'jot', to: '/bills', icon: Receipt, tone: tintClass(2) },
  { key: 'vote', to: '/quick-vote', icon: CheckSquare, tone: tintClass(5) },
  { key: 'headsUp', to: '/head-guess', icon: Smartphone, tone: tintClass(8) },
]

// "ลองเล่นเลย": a sideways row of ideas that open a tool (Steam-style discovery row).
export function DiscoverRow() {
  const { t } = useTranslation()
  return (
    <section>
      <SectionHeader title={t('home.discoverTitle')} />
      <HScroll label={t('home.discoverTitle')}>
        {ITEMS.map(({ key, to, icon: Icon, tone, soon }) => (
          <Link key={key} to={to} className={cn('flex w-40 shrink-0 snap-start flex-col gap-1 rounded-2xl p-3 active:opacity-90', tone)}>
            <Icon className="size-6" aria-hidden="true" />
            <span className="mt-1 text-sm font-medium">{t(`home.discover.${key}.title`)}</span>
            <span className="text-xs opacity-80">{soon ? t('explore.soon') : t(`home.discover.${key}.text`)}</span>
          </Link>
        ))}
      </HScroll>
    </section>
  )
}

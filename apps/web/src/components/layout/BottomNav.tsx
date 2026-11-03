import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Home, PawPrint, Sparkles, User, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'home' | 'gangs' | 'explore' | 'pet' | 'me'
type Tab = { to: string; key: TabKey; icon: LucideIcon; center?: boolean }

const TABS: Tab[] = [
  { to: '/', key: 'home', icon: Home },
  { to: '/gangs', key: 'gangs', icon: Users },
  { to: '/explore', key: 'explore', icon: Sparkles, center: true },
  { to: '/pet', key: 'pet', icon: PawPrint },
  { to: '/me', key: 'me', icon: User },
]

// Bottom tab bar. The center tab ("ทำอะไรดี") is a raised, highlighted button.
export function BottomNav() {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('nav.label')}
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-md items-end justify-around px-1">
        {TABS.map(({ to, key, icon: Icon, center }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex h-16 flex-col items-center justify-end gap-0.5 pb-2 text-[11px] transition-colors',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {center ? (
                    <span className="-mt-5 mb-0.5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-transform active:scale-95">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                  ) : (
                    <Icon className="size-6" strokeWidth={isActive ? 2.4 : 1.8} aria-hidden="true" />
                  )}
                  <span>{t(`nav.${key}`)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

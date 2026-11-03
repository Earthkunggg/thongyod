import { NavLink } from 'react-router'
import { Home, PawPrint, Sparkles, User, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = { to: string; label: string; icon: LucideIcon; center?: boolean }

const TABS: Tab[] = [
  { to: '/', label: 'หน้าหลัก', icon: Home },
  { to: '/gangs', label: 'แก๊ง', icon: Users },
  { to: '/explore', label: 'ทำอะไรดี', icon: Sparkles, center: true },
  { to: '/pet', label: 'น้อง', icon: PawPrint },
  { to: '/me', label: 'ฉัน', icon: User },
]

// Bottom tab bar. The center tab ("ทำอะไรดี") is a raised, highlighted button.
export function BottomNav() {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex h-16 max-w-md items-end justify-around px-1">
        {TABS.map(({ to, label, icon: Icon, center }) => (
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
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

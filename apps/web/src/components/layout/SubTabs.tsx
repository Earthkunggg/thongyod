import { NavLink, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

type SubTab = { to: string; label: string }

// Tabs inside a page that change the URL (e.g. แก๊ง | เพื่อน). Underline marks the current one.
export function SubTabs({ tabs, label }: { tabs: SubTab[]; label: string }) {
  const location = useLocation()
  return (
    <nav aria-label={label} className="flex border-b px-3">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          // Switching sub-tabs replaces history and keeps the back button (if any) pointing to where you came from.
          replace
          state={location.state}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px flex h-11 flex-1 items-center justify-center border-b-2 text-sm transition-colors',
              isActive ? 'border-primary font-medium text-foreground' : 'border-transparent text-muted-foreground',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

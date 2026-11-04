import { cn } from '@/lib/utils'

// Small red number on an icon (tab bar, bell). Hidden at 0; shows "9+" above 9.
// Put it inside a `relative` wrapper around the icon.
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute -top-1 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-none font-medium text-white',
        className,
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

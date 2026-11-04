import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

/** Stable tint 1–8 from the gang id, so a gang keeps its color everywhere. */
function tintOf(id: string): number {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return (hash % 8) + 1
}

// Rounded square with the gang's first letter in its own tint (until gangs have pictures).
export function GangAvatar({ id, name, className }: { id: string; name: string; className?: string }) {
  const letter = name.trim().match(/[ก-ฮA-Za-z0-9]/)?.[0]?.toUpperCase() ?? '?'
  return (
    <span aria-hidden="true" className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl text-base font-medium', tintClass(tintOf(id)), className)}>
      {letter}
    </span>
  )
}

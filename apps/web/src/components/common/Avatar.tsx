import { useState } from 'react'
import { cn } from '@/lib/utils'

// Thai names can start with a leading vowel (เ แ โ ใ ไ), e.g. "เบียร์".
// Show the first consonant/letter instead so it reads "บ", not "เ".
function initialOf(name: string): string {
  const match = name.trim().match(/[ก-ฮA-Za-z0-9]/)
  return match ? match[0].toUpperCase() : '?'
}

type AvatarProps = {
  name: string
  /** Photo URL (uploaded or from LINE). Falls back to the initial if missing or broken. */
  src?: string | null
  className?: string
}

// Round avatar: the person's photo, or the first letter of their name.
export function Avatar({ name, src, className }: AvatarProps) {
  const [broken, setBroken] = useState<string | null>(null)
  const showPhoto = src && broken !== src
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      {showPhoto ? (
        <img src={src} alt="" className="size-full object-cover" loading="lazy" decoding="async" onError={() => setBroken(src)} />
      ) : (
        initialOf(name)
      )}
    </span>
  )
}

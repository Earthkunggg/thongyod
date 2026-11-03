import { cn } from '@/lib/utils'

// Thai names can start with a leading vowel (เ แ โ ใ ไ), e.g. "เบียร์".
// Show the first consonant/letter instead so it reads "บ", not "เ".
function initialOf(name: string): string {
  const match = name.trim().match(/[ก-ฮA-Za-z0-9]/)
  return match ? match[0].toUpperCase() : '?'
}

// Circle with the first letter of a name. Real photos come later.
export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      {initialOf(name)}
    </span>
  )
}

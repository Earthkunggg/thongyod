import type { ReactNode } from 'react'
import { FitText } from '@/components/common/FitText'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import './games.css'

type GameCardProps = {
  /** Changing this plays the "dealt card" animation. */
  cardKey: string
  text: string
  /** Small line above the text (pack name, "ใบที่ 4"). */
  eyebrow?: ReactNode
  /** Extra content under the text (forbidden words, buttons). */
  children?: ReactNode
  tint: number
  /** The card came from "ย้อนกลับ". */
  back?: boolean
  onTap?: () => void
  tapLabel?: string
  className?: string
}

// The big card in a party game: the text is as large as fits (FitText), a new card is dealt in with a 3D turn.
export function GameCard({ cardKey, text, eyebrow, children, tint, back, onTap, tapLabel, className }: GameCardProps) {
  const body = (
    <>
      {eyebrow && <span className="text-sm font-medium opacity-80">{eyebrow}</span>}
      <FitText text={text} max={56} min={22} maxLines={4} className="min-h-0 w-full flex-1 font-medium" />
      {children}
    </>
  )
  const classes = cn(
    'flex h-[min(52dvh,30rem)] min-h-72 w-full flex-col items-center gap-3 rounded-3xl p-5 text-center shadow-sm',
    tintClass(tint),
    back ? 'game-card-back' : 'game-card-in',
    className,
  )
  return onTap ? (
    <button key={cardKey} type="button" onClick={onTap} aria-label={tapLabel} className={cn(classes, 'active:scale-[0.99]')}>
      {body}
    </button>
  ) : (
    <div key={cardKey} className={classes} role="status">
      {body}
    </div>
  )
}

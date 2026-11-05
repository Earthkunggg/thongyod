import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import './games.css'

type FlipCardProps = {
  flipped: boolean
  front: ReactNode
  back: ReactNode
  className?: string
}

// A card that turns over in 3D (secret roles, the word to draw). Both faces fill the card; size it with className.
export function FlipCard({ flipped, front, back, className }: FlipCardProps) {
  return (
    <div className={cn('flip-card', className)} data-flipped={flipped}>
      <div className="flip-card-inner">
        <div className="flip-card-face" aria-hidden={flipped}>
          {front}
        </div>
        <div className="flip-card-face flip-card-back" aria-hidden={!flipped}>
          {back}
        </div>
      </div>
    </div>
  )
}

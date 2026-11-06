import cup from '@/assets/fortune/cup.webp'
import sparkle from '@/assets/fortune/sparkle.webp'
import stickImg from '@/assets/fortune/stick.webp'
import { cn } from '@/lib/utils'
import './fortune.css'

type Props = {
  /** idle = gentle sway, shaking = rattle, out = the stick slides out and drops (animated), rest = stick already lying there. */
  state: 'idle' | 'shaking' | 'out' | 'rest'
  /** Number on the stick (out / rest). */
  stick?: number
  className?: string
}

/** Where the sparkles fly (from where the stick lands). */
const SPARKLES = [
  { dx: '-5rem', dy: '-2rem', delay: '1.05s' },
  { dx: '4.6rem', dy: '-2.4rem', delay: '1.15s' },
  { dx: '-6rem', dy: '0.4rem', delay: '1.2s' },
  { dx: '5.6rem', dy: '0.2rem', delay: '1.1s' },
  { dx: '0.4rem', dy: '-3rem', delay: '1.12s' },
]

// The เซียมซี cup from Earth's art: one picture moved with smooth transforms (no frame swapping),
// plus a separate stick that slides out of the cup mouth and drops in front of it.
export function FortuneCup({ state, stick, className }: Props) {
  const showStick = (state === 'out' || state === 'rest') && stick !== undefined
  return (
    <div className={cn('fortune-stage', className)} aria-hidden="true">
      {showStick && (
        <div className={cn('fortune-stick', state === 'out' ? 'is-out' : 'is-rest')}>
          <img src={stickImg} alt="" draggable={false} />
          <span className="fortune-stick-no">{stick}</span>
        </div>
      )}
      <img src={cup} alt="" draggable={false} className={cn('fortune-cup', state === 'idle' && 'is-idle', state === 'shaking' && 'is-shaking', state === 'out' && 'is-out')} />
      {state === 'out' &&
        SPARKLES.map((s, i) => (
          <img
            key={i}
            src={sparkle}
            alt=""
            className="fortune-sparkle is-out"
            style={{ left: 'calc(50% - 1.8rem)', bottom: '0.2rem', ['--dx' as string]: s.dx, ['--dy' as string]: s.dy, animationDelay: s.delay }}
          />
        ))}
    </div>
  )
}

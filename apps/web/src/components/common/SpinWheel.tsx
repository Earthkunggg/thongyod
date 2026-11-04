import { cn } from '@/lib/utils'

// Pastel slices with dark text: readable in light and dark mode.
const SLICE_COLORS = ['#FFB4A2', '#FFD6A5', '#FDF5A6', '#CAFFBF', '#9BF6FF', '#A0C4FF', '#BDB2FF', '#FFC6FF']
const TEXT_COLOR = '#3B2F2F'
const R = 96
const LABEL_CHARS = 10

type SpinWheelProps = {
  options: string[]
  /** Clockwise rotation in degrees. Change it to spin; the wheel animates there. */
  rotation: number
  /** Animate to `rotation` over this many ms (0 = jump). */
  durationMs: number
  /** Fires when the spin animation ends. */
  onSpinEnd?: () => void
  /** Tap on the wheel (spin, or skip the animation while spinning). */
  onTap?: () => void
  label: string
  className?: string
}

/** Wheel of names. It only draws; who wins is decided outside (features/wheel/logic). */
export function SpinWheel({ options, rotation, durationMs, onSpinEnd, onTap, label, className }: SpinWheelProps) {
  const count = Math.max(options.length, 1)
  const size = 360 / count
  const fontSize = count <= 4 ? 12 : count <= 8 ? 10 : 8.5

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className={cn('relative aspect-square w-full touch-manipulation select-none active:scale-[0.99]', className)}
    >
      {/* Pointer: fixed at the top, does not rotate. */}
      <svg viewBox="0 0 40 34" className="absolute top-0 left-1/2 z-10 w-9 -translate-x-1/2 -translate-y-1 drop-shadow" aria-hidden="true">
        <path d="M4 3 H36 L20 31 Z" fill="var(--primary)" stroke="var(--background)" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      {/* Rotate an HTML box (not an SVG group) so the pivot is always the exact center. */}
      <div
        className="size-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: durationMs > 0 ? `transform ${durationMs}ms cubic-bezier(0.15, 0.7, 0.12, 1)` : 'none',
        }}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget) onSpinEnd?.()
        }}
      >
        <svg viewBox="-100 -100 200 200" className="size-full" aria-hidden="true">
          <circle r={R + 3} fill="var(--card)" stroke="var(--border)" strokeWidth="2" />
          {options.map((option, i) => {
            const start = i * size
            const center = start + size / 2
            const text = option.length > LABEL_CHARS ? `${option.slice(0, LABEL_CHARS - 1)}…` : option
            // Left half: turn the text around so it never reads upside down.
            const flip = center > 180
            return (
              <g key={i}>
                {count === 1 ? (
                  <circle r={R} fill={SLICE_COLORS[0]} />
                ) : (
                  <path d={slicePath(start, start + size)} fill={sliceColor(i, count)} stroke="#ffffff" strokeWidth="1.2" />
                )}
                {/* Text runs from the rim toward the middle, along the slice center. */}
                <text
                  transform={`rotate(${flip ? center + 90 : center - 90})`}
                  x={flip ? -(R - 8) : R - 8}
                  y={0}
                  textAnchor={flip ? 'start' : 'end'}
                  dominantBaseline="central"
                  fill={TEXT_COLOR}
                  fontSize={fontSize}
                  fontWeight={600}
                >
                  {text}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <svg viewBox="-100 -100 200 200" className="absolute inset-0 size-full" aria-hidden="true">
        <circle r={16} fill="var(--background)" stroke="var(--primary)" strokeWidth="3" />
        <circle r={5} fill="var(--primary)" />
      </svg>
    </button>
  )
}

function point(angle: number, radius: number): string {
  const rad = (angle * Math.PI) / 180
  return `${(Math.sin(rad) * radius).toFixed(3)} ${(-Math.cos(rad) * radius).toFixed(3)}`
}

function slicePath(from: number, to: number): string {
  const large = to - from > 180 ? 1 : 0
  return `M0 0 L${point(from, R)} A${R} ${R} 0 ${large} 1 ${point(to, R)} Z`
}

/** Cycles the palette, but never paints the last slice like the first one (they touch). */
function sliceColor(i: number, count: number): string {
  const color = SLICE_COLORS[i % SLICE_COLORS.length]
  if (i === count - 1 && i % SLICE_COLORS.length === 0) return SLICE_COLORS[3]
  return color
}

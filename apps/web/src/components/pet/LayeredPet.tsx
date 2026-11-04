import { useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import { CANVAS, PIVOTS, eyes as eyeParts, mouth as mouthPart, part, type RigPart } from './rigs/dragon'
import { EXPRESSIONS, NO_BLINK, lookOffset, type Expression } from './rigs/expressions'
import { cn } from '@/lib/utils'
import './layered.css'

export type LayeredPetHandle = {
  /** Play the tap reaction (squish + hop + happy face + sparkles). */
  react: () => void
  /** Fall asleep now (wakes on the next tap). */
  sleep: () => void
}

type Props = {
  /** Resting face. */
  expression?: Expression
  /** Width in px; height follows the art. */
  size?: number
  onTap?: () => void
  /** Eyes follow the finger / pointer (off with reduced motion). */
  follow?: boolean
  /** Falls asleep after this long without a tap (0 = never). */
  sleepAfterMs?: number
  className?: string
  ref?: Ref<LayeredPetHandle>
}

const pct = (n: number, of: number) => `${(n / of) * 100}%`
const origin = ([x, y]: readonly [number, number]) => `${pct(x, CANVAS.w)} ${pct(y, CANVAS.h)}`
const REACT_MS = 1300
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Part({ p, style }: { p: RigPart; style?: CSSProperties }) {
  const [x, y, w, h] = p.box
  return <img src={p.src} alt="" draggable={false} className="lp-part" style={{ left: pct(x, CANVAS.w), top: pct(y, CANVAS.h), width: pct(w, CANVAS.w), height: pct(h, CANVAS.h), ...style }} />
}

// The dragon built from separate parts (DECISIONS #67): wings flap, tail wags, body breathes, eyes blink
// and follow the finger, the face changes with the expression. Tap = happy hop. Same props idea as <Pet>.
export function LayeredPet({ expression = 'sulky', size = 240, onTap, follow = true, sleepAfterMs = 60_000, className, ref }: Props) {
  const root = useRef<HTMLButtonElement>(null)
  const [blink, setBlink] = useState(false)
  const [reacting, setReacting] = useState(0)
  const [asleep, setAsleep] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [look, setLook] = useState<[number, number]>([0, 0])
  const lastTap = useRef(0)

  const face = EXPRESSIONS[reacting ? 'happy' : asleep ? 'sleepy' : expression]
  const eyesNow = eyeParts(blink && !NO_BLINK.has(face.eyes) ? 'closed' : face.eyes)

  // Blink at a natural, uneven rhythm (cosmetic, so Math.random is fine here).
  useEffect(() => {
    if (asleep || hidden) return
    let timer = 0
    const schedule = () => {
      timer = window.setTimeout(() => {
        setBlink(true)
        timer = window.setTimeout(() => {
          setBlink(false)
          schedule()
        }, 130)
      }, 2200 + Math.random() * 3800)
    }
    schedule()
    return () => window.clearTimeout(timer)
  }, [asleep, hidden])

  // Fall asleep after a long quiet time; pause everything when the page is hidden.
  useEffect(() => {
    if (!sleepAfterMs || asleep) return
    const id = window.setTimeout(() => setAsleep(true), sleepAfterMs)
    return () => window.clearTimeout(id)
  }, [sleepAfterMs, asleep, reacting])
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Eyes follow the pointer (throttled to animation frames).
  useEffect(() => {
    if (!follow || asleep || reducedMotion()) return
    let frame = 0
    const onMove = (e: PointerEvent) => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const box = root.current?.getBoundingClientRect()
        if (!box) return
        const unit = CANVAS.w / box.width
        setLook(lookOffset((e.clientX - (box.left + box.width * 0.4)) * unit, (e.clientY - (box.top + box.height * 0.42)) * unit))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [follow, asleep])

  function react() {
    setAsleep(false)
    const id = Date.now()
    lastTap.current = id
    setReacting(id)
    window.setTimeout(() => lastTap.current === id && setReacting(0), REACT_MS)
  }
  useImperativeHandle(ref, () => ({ react, sleep: () => setAsleep(true) }))

  const lookStyle = { transform: `translate(${pct(look[0], CANVAS.w)}, ${pct(look[1], CANVAS.h)})` }
  const mouthLook = { transform: `translate(${pct(look[0] / 2, CANVAS.w)}, ${pct(look[1] / 2, CANVAS.h)})` }

  return (
    <button
      ref={root}
      type="button"
      onClick={() => {
        react()
        onTap?.()
      }}
      aria-hidden={onTap ? undefined : true}
      tabIndex={onTap ? 0 : -1}
      className={cn('relative block shrink-0 touch-manipulation', (asleep && !reacting) && 'lp-sleeping', reacting && 'lp-fast', hidden && 'lp-paused', className)}
      style={{ width: size, height: (size * CANVAS.h) / CANVAS.w }}
    >
      <span key={reacting || 'still'} className={cn('lp-layer', reacting && 'lp-hop')} style={{ transformOrigin: origin(PIVOTS.ground) }}>
        {/* Behind the body: wings and tail. */}
        <span className="lp-layer lp-wing-r" style={{ transformOrigin: origin(PIVOTS.wingRight) }}>
          <Part p={part('wing_right')} />
        </span>
        <span className="lp-layer lp-wing-l" style={{ transformOrigin: origin(PIVOTS.wingLeft) }}>
          <Part p={part('wing_left')} />
        </span>
        <span className="lp-layer lp-tail" style={{ transformOrigin: origin(PIVOTS.tail) }}>
          <Part p={part('tail')} />
        </span>
        <span className="lp-layer lp-breathe" style={{ transformOrigin: origin(PIVOTS.ground) }}>
          <Part p={part('body')} />
          <span className="lp-layer lp-face" style={lookStyle}>
            <Part p={eyesNow.l} />
            <Part p={eyesNow.r} />
          </span>
          <span className="lp-layer lp-face" style={mouthLook}>
            <Part p={mouthPart(face.mouth)} />
          </span>
          {face.effect && <Part p={part(face.effect)} />}
        </span>
        {reacting !== 0 &&
          [
            [8, 18],
            [78, 8],
            [88, 40],
          ].map(([x, y], i) => (
            <svg key={i} viewBox="0 0 24 24" className="lp-spark text-tone-warning-foreground" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 90}ms` }} aria-hidden="true">
              <path d="M12 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill="currentColor" />
            </svg>
          ))}
        {asleep && !reacting && (
          <span className="text-muted-foreground" aria-hidden="true">
            <span className="lp-z" style={{ left: '72%', top: '14%', fontSize: size * 0.09 }}>z</span>
            <span className="lp-z" style={{ left: '78%', top: '6%', fontSize: size * 0.07, animationDelay: '0.8s' }}>z</span>
          </span>
        )}
      </span>
    </button>
  )
}

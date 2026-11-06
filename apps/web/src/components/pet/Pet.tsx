import { useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BLINK_MS,
  LONG_PRESS_MS,
  POSES,
  TAP_ACTIONS,
  blinkDelayMs,
  idleDelayMs,
  pickIdle,
  pickOther,
  planFor,
  sleepAfterMs,
  type Overlay,
  type PetAction,
  type PoseId,
} from '@/features/pet/behavior'
import { CELEBRATE_EVENT, celebrationDue, markCelebrated } from '@/features/pet/celebrate'
import { MOTIONS } from '@/features/pet/motions'
import { cn } from '@/lib/utils'
import { PET_SPECIES, type PetSpeciesId } from './species'
import './pet.css'

// The pet (DECISIONS #47, #80, UX_GUIDELINES §2). Three layers that never fight each other:
// 1. "alive" (CSS, always): breathing or floating.
// 2. "move" (Web Animations, one-shot): hop, fly, turn, sneeze, dance… from features/pet/motions.ts.
// 3. pose images: all 12 are mounted and decoded up front and swap instantly at the squashed moment of a move
//    (or the thinnest moment of a turn), like cartoon frames: never two drawings at once, never a flash.
// Blinking = a separate eyes-closed layer over the main pose (same pixels except the eyes).

/** Anything a parent can trigger (pet page buttons, celebrations). */
export type PetAct = PetAction | 'idle'
export type PetHandle = { run: (act: PetAct) => void }

type PetProps = {
  species: PetSpeciesId
  /** Whole footprint width in px (room for every move is inside it). */
  size?: number
  ref?: Ref<PetHandle>
  className?: string
  /** Called when the user taps the pet (after its own reaction starts). */
  onTap?: () => void
}

/**
 * Room around the art for its moves, as a share of the art size: fly/jump go up to 22 % (+ hearts, z above),
 * dash 9 % + small tilts to the sides. Checked frame by frame on phone and tablet sizes (scratch poseboxes check).
 */
const ROOM = { top: 0.36, side: 0.2, bottom: 0.06 }
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const rnd = (n: number) => Math.floor(Math.random() * n)
const eased = (frames: Keyframe[]) => frames.map((k) => ({ ...k, easing: 'ease-in-out' }))

export function Pet({ species, size = 240, ref, className, onTap: onTapProp }: PetProps) {
  const { t } = useTranslation()
  const spec = PET_SPECIES[species]
  const [pose, setPose] = useState<PoseId>('main')
  const [overlay, setOverlay] = useState<{ name: Overlay; key: number }>({ name: 'none', key: 0 })
  const [blink, setBlink] = useState(false)
  const [asleep, setAsleep] = useState(false)
  const [paused, setPaused] = useState(false)
  const move = useRef<HTMLSpanElement>(null)
  const shadow = useRef<HTMLSpanElement>(null)
  const timers = useRef<number[]>([])
  const idleTimer = useRef(0)
  const lastTouch = useRef(0)
  const lastTap = useRef<PetAction | null>(null)
  const lastIdle = useRef<PetAction | null>(null)
  const busy = useRef(false)
  const pressTimer = useRef(0)
  const longPressed = useRef(false)
  const poseRef = useRef<PoseId>('main')

  /**
   * Run `fn` after `ms` on the animation clock (an empty Web Animation), not on setTimeout:
   * the pose swap and the end of a move stay in step with the motion even if the browser slows or pauses animations.
   */
  const clocks = useRef<Animation[]>([])
  const after = useCallback((ms: number, fn: () => void) => {
    const el = move.current
    if (!el?.animate) {
      timers.current.push(window.setTimeout(fn, ms))
      return
    }
    const clock = el.animate(null, { duration: ms })
    clocks.current.push(clock)
    clock.finished.then(fn).catch(() => {})
  }, [])
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
    clocks.current.forEach((c) => c.cancel())
    clocks.current = []
  }

  /** Play a move and swap to `next` pose at the move's squashed moment (instantly when motion is reduced). */
  const moveTo = useCallback((next: PoseId, name: keyof typeof MOTIONS | 'none') => {
    const swap = () => {
      poseRef.current = next
      setPose(next)
    }
    const motion = name === 'none' && next !== poseRef.current ? 'settle' : name
    if (motion === 'none' || reducedMotion()) return swap()
    const m = MOTIONS[motion]
    move.current?.getAnimations().forEach((a) => a.cancel())
    shadow.current?.getAnimations().forEach((a) => a.cancel())
    clocks.current = []
    // Easing per key frame (linear overall), so each key frame lands exactly at its offset and the swap timer matches it.
    move.current?.animate(eased(m.frames), { duration: m.ms, easing: 'linear' })
    if (m.shadow) shadow.current?.animate(eased(m.shadow), { duration: m.ms, easing: 'linear' })
    if (next !== poseRef.current) after(m.ms * m.swapAt, swap)
  }, [after])

  // run() and the idle clock call each other, so both live in refs that are refreshed every render.
  const runRef = useRef<(act: PetAct) => void>(() => {})
  const scheduleIdle = useCallback(function schedule() {
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => {
      if (document.hidden || busy.current) return schedule()
      const hour = new Date().getHours()
      if (Date.now() - lastTouch.current > sleepAfterMs(hour)) return runRef.current('sleep')
      const next = pickIdle(lastIdle.current, hour, rnd)
      lastIdle.current = next
      runRef.current(next)
    }, idleDelayMs(rnd))
  }, [])

  const run = useCallback(
    (act: PetAct) => {
      clearTimers()
      if (act === 'idle') {
        busy.current = false
        setAsleep(false)
        setOverlay({ name: 'none', key: Date.now() })
        moveTo('main', 'none')
        scheduleIdle()
        return
      }
      const plan = planFor(act, spec.moves)
      busy.current = true
      setAsleep(act === 'sleep')
      moveTo(plan.pose, plan.motion)
      setOverlay({ name: plan.overlay, key: Date.now() })
      if (plan.ms > 0) {
        after(plan.ms, () => {
          busy.current = false
          moveTo('main', 'none')
          setOverlay((o) => ({ ...o, name: 'none' }))
          scheduleIdle()
        })
      } else {
        busy.current = false
        window.clearTimeout(idleTimer.current)
      }
    },
    [after, moveTo, scheduleIdle, spec.moves],
  )
  useEffect(() => {
    runRef.current = run
  })

  // Start living: idle clock, and a celebration if today's missions were finished elsewhere.
  useEffect(() => {
    lastTouch.current = Date.now()
    scheduleIdle()
    const celebrate = () => {
      if (!celebrationDue()) return
      markCelebrated()
      window.setTimeout(() => runRef.current('celebrate'), 500)
    }
    celebrate()
    window.addEventListener(CELEBRATE_EVENT, celebrate)
    return () => {
      window.removeEventListener(CELEBRATE_EVENT, celebrate)
      window.clearTimeout(idleTimer.current)
      clearTimers()
    }
  }, [scheduleIdle])

  // Decode every pose before it is needed, so the first switch is instant.
  useEffect(() => {
    for (const p of POSES) {
      const img = new Image()
      img.src = spec.poses[p]
      img.decode?.().catch(() => {})
    }
  }, [spec])

  // Blink now and then, only while resting on the main pose.
  useEffect(() => {
    if (pose !== 'main' || asleep) return
    let id = 0
    let open = 0
    const schedule = () => {
      id = window.setTimeout(() => {
        if (!busy.current && !document.hidden) {
          setBlink(true)
          open = window.setTimeout(() => setBlink(false), BLINK_MS)
        }
        schedule()
      }, blinkDelayMs(rnd))
    }
    schedule()
    return () => {
      window.clearTimeout(id)
      window.clearTimeout(open)
      setBlink(false)
    }
  }, [pose, asleep])

  // Stop all motion while the page is hidden (battery).
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useImperativeHandle(ref, () => ({ run: (act) => runRef.current(act) }), [])

  function touched() {
    lastTouch.current = Date.now()
  }
  function onPointerDown() {
    touched()
    longPressed.current = false
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => {
      longPressed.current = true
      navigator.vibrate?.(20)
      run('love')
    }, LONG_PRESS_MS)
  }
  const cancelPress = () => window.clearTimeout(pressTimer.current)
  function onClick() {
    cancelPress()
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    touched()
    const next = pickOther(TAP_ACTIONS, lastTap.current as (typeof TAP_ACTIONS)[number] | null, rnd)
    lastTap.current = next
    run(next)
    onTapProp?.()
  }

  const [mx, my] = spec.anchors.mouth
  const [hx, hy] = spec.anchors.head
  const at = (x: number, y: number): CSSProperties => ({ left: `${x * 100}%`, top: `${y * 100}%` })
  const airborne = spec.alive === 'float' && !asleep

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onPointerCancel={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={t('pet.tapLabel', { name: t(`pet.species.${species}`) })}
      className={cn('pet relative block touch-manipulation select-none', paused && 'pet-paused', className)}
      style={{ width: size, aspectRatio: `${spec.aspect * (1 + 2 * ROOM.side)} / ${1 + ROOM.top + ROOM.bottom}`, fontSize: size / 12 }}
    >
      {/* The art box: room for every move is around it, inside the footprint. */}
      <span
        className="absolute"
        style={{
          left: `${(ROOM.side / (1 + 2 * ROOM.side)) * 100}%`,
          width: `${(1 / (1 + 2 * ROOM.side)) * 100}%`,
          top: `${(ROOM.top / (1 + ROOM.top + ROOM.bottom)) * 100}%`,
          height: `${(1 / (1 + ROOM.top + ROOM.bottom)) * 100}%`,
        }}
      >
        <span aria-hidden="true" className={cn('pet-shadow-wrap absolute bottom-[-3%] left-[16%] h-[9%] w-[68%]', airborne && 'pet-shadow-float')}>
          <span ref={shadow} className="pet-shadow block size-full rounded-[50%] bg-black/10 dark:bg-black/40" />
        </span>
        <span aria-hidden="true" className={cn('pet-alive absolute inset-0', asleep ? 'pet-sleeping' : spec.alive === 'float' ? 'pet-float' : 'pet-breathe')}>
          <span ref={move} className="pet-move absolute inset-0">
            {POSES.filter((p) => p !== 'blink').map((p) => (
              <img
                key={p}
                src={spec.poses[p]}
                alt=""
                draggable={false}
                decoding="async"
                className="pet-layer absolute inset-0 size-full"
                style={{ opacity: p === pose ? 1 : 0, zIndex: p === pose ? 2 : 0 }}
              />
            ))}
            <img
              src={spec.poses.blink}
              alt=""
              draggable={false}
              decoding="async"
              className="pet-layer absolute inset-0 size-full"
              style={{ opacity: blink && pose === 'main' ? 1 : 0, zIndex: 3, transition: 'opacity 45ms linear' }}
            />
          </span>
        </span>
        <PetOverlay key={overlay.key} name={asleep ? 'z' : overlay.name} mouth={at(mx, my)} head={at(hx, hy)} />
      </span>
    </button>
  )
}

/** Little drawings around the pet. Sized in em (1em = footprint / 12) so they scale with the pet. */
function PetOverlay({ name, mouth, head }: { name: Overlay; mouth: CSSProperties; head: CSSProperties }) {
  if (name === 'none') return null
  const star = 'M12 0 L15 9 L24 12 L15 15 L12 24 L9 15 L0 12 L9 9 Z'
  const heart = 'M12 21 C6 16 1 12.5 1 7.5 C1 4 3.7 1.5 7 1.5 C9.2 1.5 11 2.7 12 4.5 C13 2.7 14.8 1.5 17 1.5 C20.3 1.5 23 4 23 7.5 C23 12.5 18 16 12 21 Z'
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {name === 'sparks' &&
        [-1.6, 0.2, 1.8].map((dx, i) => (
          <svg key={i} viewBox="0 0 24 24" className="pet-fx pet-spark absolute size-[0.9em]" style={{ ...head, marginLeft: `${dx}em`, marginTop: `${-0.4 - (i % 2) * 0.5}em`, animationDelay: `${i * 0.1}s` }}>
            <path d={star} fill="#F6C445" stroke="#E0A019" strokeWidth="1.2" />
          </svg>
        ))}
      {name === 'hearts' &&
        [-1, 0.3, 1.4].map((dx, i) => (
          <svg key={i} viewBox="0 0 24 24" className="pet-fx pet-heart absolute size-[0.85em]" style={{ ...head, marginLeft: `${dx}em`, animationDelay: `${i * 0.22}s` }}>
            <path d={heart} fill="#FF7A9A" stroke="#D94D73" strokeWidth="1.4" />
          </svg>
        ))}
      {name === 'puff' &&
        [0, 1, 2].map((i) => (
          <span key={i} className="pet-fx pet-puff absolute block rounded-full border-[0.08em] border-[#C9B8C9] bg-white" style={{ ...mouth, width: `${1.4 - i * 0.3}em`, height: `${1.4 - i * 0.3}em`, animationDelay: `${0.12 + i * 0.1}s` }} />
        ))}
      {name === 'bubbles' &&
        [0, 1, 2].map((i) => (
          <span key={i} className="pet-fx pet-bubble absolute block rounded-full border-[0.07em] border-[#8CC8F0] bg-[#E6F4FF]/70" style={{ ...mouth, width: `${0.7 - i * 0.15}em`, height: `${0.7 - i * 0.15}em`, animationDelay: `${i * 0.25}s` }} />
        ))}
      {name === 'crumbs' &&
        [0, 1, 2, 3].map((i) => (
          <span key={i} className="pet-fx pet-crumb absolute block size-[0.22em] rounded-full bg-[#C98A3D]" style={{ ...mouth, marginLeft: `${(i - 1.5) * 0.35}em`, animationDelay: `${0.2 + i * 0.35}s` }} />
        ))}
      {name === 'confetti' &&
        ['#F6C445', '#FF7A9A', '#7CC6F2', '#8FD694', '#B89CF0', '#F6C445', '#FF7A9A', '#7CC6F2'].map((c, i) => (
          <span
            key={i}
            className="pet-fx pet-confetti absolute block h-[0.35em] w-[0.18em] rounded-[0.05em]"
            style={{ ...head, background: c, ['--dx' as string]: `${(i - 3.5) * 0.9}em`, ['--rot' as string]: `${(i % 2 ? 1 : -1) * (120 + i * 30)}deg`, animationDelay: `${(i % 4) * 0.08}s` }}
          />
        ))}
      {name === 'z' &&
        [0, 1, 2].map((i) => (
          <span key={i} className="pet-fx pet-z absolute font-bold text-[#8E7FA8]" style={{ ...head, marginLeft: '1.6em', fontSize: `${1 - i * 0.18}em`, animationDelay: `${i * 0.8}s` }}>
            z
          </span>
        ))}
    </span>
  )
}

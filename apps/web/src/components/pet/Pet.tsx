import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { PET_SPECIES, type PetSpeciesId } from './species'
import './pet.css'

// A pet that is always alive (DECISIONS #47, UX_GUIDELINES §2): breathes or floats and blinks,
// does game-style idle actions after 15 s / 30 s / 60 s without interaction, reacts to taps.

export type PetAct = 'idle' | 'short' | 'mid' | 'sleep' | 'tap'
type Pose = 'main' | 'tap' | 'mid' | 'sleep'
type Anim = 'none' | 'squish' | 'mid' | 'land'

/** Seconds without interaction before each idle action. */
const IDLE_STEPS = { short: 15, mid: 30, sleep: 60 } as const
const MID_MS = 1900
const TAP_MS = 1400

/** Imperative handle, e.g. for dev buttons that jump to an idle action. */
export type PetHandle = { run: (act: PetAct) => void }

type PetProps = {
  species: PetSpeciesId
  /** Display width in px. */
  size?: number
  ref?: Ref<PetHandle>
  className?: string
  /** Called when the user taps the pet (after its own reaction starts). */
  onTap?: () => void
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Pet({ species, size = 240, ref, className, onTap: onTapProp }: PetProps) {
  const { t } = useTranslation()
  const spec = PET_SPECIES[species]
  const [pose, setPose] = useState<Pose>('main')
  const [act, setAct] = useState<PetAct>('idle')
  const [anim, setAnim] = useState<Anim>('none')
  const [blink, setBlink] = useState(false)
  const [paused, setPaused] = useState(false)
  const idleSince = useRef(0)
  const done = useRef<Set<PetAct>>(new Set())
  const timers = useRef<number[]>([])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])
  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
  }

  const run = useCallback(
    (next: PetAct) => {
      clearTimers()
      setAct(next)
      const still = reducedMotion()
      if (next === 'short') {
        setPose('main')
        setAnim('none')
        later(() => setAct('idle'), 1800)
      } else if (next === 'mid') {
        setPose('mid')
        setAnim(still ? 'none' : 'mid')
        later(() => {
          setPose('main')
          setAnim(still ? 'none' : 'land')
          setAct('idle')
        }, MID_MS)
        later(() => setAnim('none'), MID_MS + 400)
      } else if (next === 'sleep') {
        setPose(spec.poses.sleep ? 'sleep' : 'main')
        setAnim('none')
      } else if (next === 'tap') {
        setPose('tap')
        setAnim(still ? 'none' : 'squish')
        later(() => setAnim('none'), 450)
        later(() => {
          setPose('main')
          setAct('idle')
        }, TAP_MS)
      } else {
        setPose('main')
        setAnim('none')
      }
    },
    [later, spec.poses.sleep],
  )

  // Idle clock: each action happens once per idle period, in order.
  useEffect(() => {
    idleSince.current = Date.now()
    done.current.clear()
    const id = window.setInterval(() => {
      if (document.hidden) return
      const idle = (Date.now() - idleSince.current) / 1000
      const step = idle >= IDLE_STEPS.sleep ? 'sleep' : idle >= IDLE_STEPS.mid ? 'mid' : idle >= IDLE_STEPS.short ? 'short' : null
      if (step && !done.current.has(step)) {
        done.current.add(step)
        run(step)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [run, species])

  // Random blinking while awake on the main pose.
  useEffect(() => {
    if (act === 'sleep') return
    let id = 0
    const schedule = () => {
      id = window.setTimeout(() => {
        setBlink(true)
        window.setTimeout(() => setBlink(false), 140)
        schedule()
      }, 2500 + Math.random() * 3500)
    }
    schedule()
    return () => window.clearTimeout(id)
  }, [act])

  // Stop all motion while the page is hidden (battery).
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => () => clearTimers(), [])

  useImperativeHandle(ref, () => ({ run }), [run])

  function onTap() {
    idleSince.current = Date.now()
    done.current.clear()
    run('tap')
    onTapProp?.()
  }

  const sleeping = act === 'sleep'
  const image = spec.poses[pose] ?? spec.poses.main
  const lidsOn = pose === 'main' && (blink || (sleeping && !spec.poses.sleep))
  const bodyClass = cn(
    'pet-body absolute inset-0',
    anim === 'squish' && 'pet-squish',
    anim === 'mid' && (spec.mid === 'fly' ? 'pet-fly' : 'pet-swim'),
    anim === 'land' && 'pet-land',
    anim === 'none' && (sleeping ? 'pet-sleeping' : spec.alive === 'float' ? 'pet-float' : 'pet-breathe'),
  )
  const [sx, sy] = spec.anchors.short
  const [zx, zy] = spec.anchors.z

  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={t('pet.tapLabel', { name: t(`pet.species.${species}`) })}
      className={cn('relative block touch-manipulation select-none', paused && 'pet-paused', className)}
      style={{ width: size, aspectRatio: `${spec.box.w} / ${spec.box.h}` }}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pet-shadow absolute bottom-[1%] left-[18%] h-[8%] w-[64%] rounded-[50%] bg-black/10 dark:bg-black/40',
          (anim === 'mid' || (spec.alive === 'float' && !sleeping)) && 'pet-shadow-float',
        )}
      />
      <span className={bodyClass} aria-hidden="true">
        <img
          src={image.src}
          alt=""
          draggable={false}
          className="absolute bottom-[4%] left-1/2 -translate-x-1/2"
          style={{ width: image.width }}
        />
        <svg viewBox={`0 0 ${spec.box.w} ${spec.box.h}`} className="absolute inset-0 size-full overflow-visible">
          {lidsOn && (
            <g>
              <g fill={spec.lids.fill}>
                {spec.lids.ellipses.map(([cx, cy, rx, ry]) => (
                  <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} />
                ))}
              </g>
              <g fill="none" stroke={spec.lids.stroke} strokeWidth={spec.lids.width} strokeLinecap="round">
                {spec.lids.lines.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
            </g>
          )}
          {act === 'short' && spec.short === 'puff' && (
            <g className="pet-puff" fill="#FFFFFF" stroke="#C9B8C9" strokeWidth="8">
              <circle cx={sx} cy={sy} r="34" />
              <circle cx={sx - 35} cy={sy - 40} r="26" />
              <circle cx={sx - 60} cy={sy - 75} r="18" />
            </g>
          )}
          {act === 'short' && spec.short === 'bubbles' && (
            <g className="pet-bubbles" fill="#E6F4FF" fillOpacity="0.7" stroke="#8CC8F0" strokeWidth="6">
              <circle cx={sx} cy={sy} r="22" />
              <circle cx={sx - 10} cy={sy - 10} r="15" />
              <circle cx={sx + 8} cy={sy - 6} r="11" />
            </g>
          )}
          {sleeping && (
            <g fill="#8E7FA8" fontFamily="var(--app-font-heading, sans-serif)" fontWeight="700">
              <text className="pet-z" x={zx} y={zy} fontSize="80">z</text>
              <text className="pet-z" x={zx + 40} y={zy - 40} fontSize="64">z</text>
              <text className="pet-z" x={zx + 70} y={zy - 70} fontSize="52">z</text>
            </g>
          )}
          {act === 'tap' && (
            <g fill="#F6C445">
              {spec.anchors.sparks.map(([x, y, r], i) => (
                <path
                  key={`${x}-${y}`}
                  className="pet-spark"
                  style={{ animationDelay: `${i * 0.1}s` }}
                  d={`M${x} ${y - r} L${x + r * 0.35} ${y - r * 0.35} L${x + r} ${y} L${x + r * 0.35} ${y + r * 0.35} L${x} ${y + r} L${x - r * 0.35} ${y + r * 0.35} L${x - r} ${y} L${x - r * 0.35} ${y - r * 0.35} Z`}
                />
              ))}
            </g>
          )}
        </svg>
      </span>
    </button>
  )
}

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SwipeDir = 'right' | 'left' | 'up'

export type SwipeAction = {
  dir: SwipeDir
  /** Stamp text on the card while dragging, and the button label. */
  label: string
  icon: LucideIcon
  /** Tailwind classes for the stamp and button color. */
  tone: string
}

type SwipeDeckProps<T> = {
  items: T[]
  getKey: (item: T) => string
  renderCard: (item: T) => ReactNode
  /** 2 or 3 actions (left / up / right). Buttons always do the same as swiping (WCAG 2.5.7). */
  actions: SwipeAction[]
  onSwipe: (item: T, dir: SwipeDir) => void
  /** Tap (not drag) on the top card, or Enter: open its full details (Tinder-style). */
  onOpen?: (item: T) => void
  /** Accessible name of the deck, e.g. "คำชวนที่รอคุณตอบ". */
  label: string
  /** Full-page deck: taller cards. */
  tall?: boolean
  /** renderCard draws its own card surface (e.g. a 3D flip card); the deck adds no border/background. */
  bare?: boolean
}

/** Commit when dragged past this share of the card, or flung faster than this (px/ms). */
const COMMIT_SHARE = 0.32
const COMMIT_VELOCITY = 0.6
/** Past this share the card gets "heavy" (rubber band) so it never runs off by accident. */
const FREE_SHARE = 0.45
const RUBBER = 0.25
const MAX_ROTATE = 12
const FLY_MS = 220
/** A press shorter/smaller than this is a tap, not a drag. */
const TAP_MS = 300
const TAP_PX = 6
/** How many cards show behind the top one. */
const BEHIND = 2

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Free movement up to `limit`, then resistance. */
function rubber(d: number, limit: number): number {
  const abs = Math.abs(d)
  return abs <= limit ? d : Math.sign(d) * (limit + (abs - limit) * RUBBER)
}

// A stack of cards answered by swiping or with the buttons below (UX_GUIDELINES §3, DECISIONS #57).
// No library: pointer events + CSS transforms (transform/opacity only).
export function SwipeDeck<T>({ items, getKey, renderCard, actions, onSwipe, onOpen, label, tall, bare }: SwipeDeckProps<T>) {
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false, w: 300, h: 300 })
  const [flying, setFlying] = useState<SwipeDir | null>(null)
  const start = useRef({ x: 0, y: 0, t: 0, moved: 0 })
  const top = items[0]
  const allowed = new Set(actions.map((a) => a.dir))

  function commit(dir: SwipeDir) {
    if (!top || flying) return
    navigator.vibrate?.(15)
    if (reducedMotion()) {
      onSwipe(top, dir)
      setDrag((d) => ({ ...d, x: 0, y: 0, active: false }))
      return
    }
    setFlying(dir)
    window.setTimeout(() => {
      onSwipe(top, dir)
      setFlying(null)
      setDrag((d) => ({ ...d, x: 0, y: 0, active: false }))
    }, FLY_MS)
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (flying || (e.target as HTMLElement).closest('a,button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }
    const box = e.currentTarget.getBoundingClientRect()
    setDrag({ x: 0, y: 0, active: true, w: box.width, h: box.height })
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.active) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    start.current.moved = Math.max(start.current.moved, Math.hypot(dx, dy))
    // Up only when "อาจจะ" exists; downward barely moves (there is no "down" answer).
    const y = allowed.has('up') && dy < 0 ? rubber(dy, drag.h * FREE_SHARE) : Math.min(dy * 0.08, 12)
    setDrag((d) => ({ ...d, x: rubber(dx, d.w * FREE_SHARE), y }))
  }

  function onPointerUp() {
    if (!drag.active) return
    const ms = Math.max(1, performance.now() - start.current.t)
    if (onOpen && top && ms < TAP_MS && start.current.moved < TAP_PX) {
      setDrag((d) => ({ ...d, x: 0, y: 0, active: false }))
      onOpen(top)
      return
    }
    const vx = drag.x / ms
    const vy = drag.y / ms
    if (allowed.has('up') && -drag.y > drag.h * COMMIT_SHARE && -drag.y > Math.abs(drag.x)) return commit('up')
    if (drag.x > drag.w * COMMIT_SHARE || vx > COMMIT_VELOCITY) return commit('right')
    if (-drag.x > drag.w * COMMIT_SHARE || vx < -COMMIT_VELOCITY) return commit('left')
    if (allowed.has('up') && vy < -COMMIT_VELOCITY && -drag.y > Math.abs(drag.x)) return commit('up')
    setDrag((d) => ({ ...d, x: 0, y: 0, active: false })) // spring back
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' && onOpen && top) {
      e.preventDefault()
      onOpen(top)
      return
    }
    const dir = ({ ArrowRight: 'right', ArrowLeft: 'left', ArrowUp: 'up' } as const)[e.key as 'ArrowRight']
    if (dir && allowed.has(dir)) {
      e.preventDefault()
      commit(dir)
    }
  }

  if (!top) return null

  // Which stamp shows while dragging, and how strongly (0..1).
  const upward = -drag.y > Math.abs(drag.x)
  const hint: SwipeDir | null = flying ?? (upward && drag.y < -20 ? 'up' : drag.x > 20 ? 'right' : drag.x < -20 ? 'left' : null)
  const strength = flying ? 1 : Math.min(1, Math.max(Math.abs(drag.x), Math.abs(drag.y)) / (drag.w * COMMIT_SHARE))

  const fly = { right: 'translate(130%, 0) rotate(18deg)', left: 'translate(-130%, 0) rotate(-18deg)', up: 'translate(0, -130%)' }
  const transform = flying
    ? fly[flying]
    : `translate(${drag.x}px, ${drag.y}px) rotate(${Math.max(-MAX_ROTATE, Math.min(MAX_ROTATE, drag.x / 18))}deg)`
  const animate = !drag.active || flying

  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="relative mx-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
        style={{ paddingBottom: BEHIND * 10 }}
      >
        {/* Cards waiting behind, like a real stack. The next one grows into place while you drag. */}
        {items
          .slice(1, 1 + BEHIND)
          .map((item, i) => {
            const depth = i + 1 - (i === 0 ? strength : 0)
            return (
              <div
                key={getKey(item)}
                aria-hidden="true"
                inert
                className={cn('absolute inset-x-0 flex flex-col overflow-hidden rounded-2xl', !bare && 'border bg-card shadow-sm')}
                style={{
                  top: 0,
                  bottom: BEHIND * 10,
                  transform: `translateY(${depth * 10}px) scale(${1 - depth * 0.05})`,
                  transformOrigin: '50% 100%',
                  opacity: 1 - depth * 0.25,
                  zIndex: BEHIND - i,
                  transition: animate ? `transform ${FLY_MS}ms ease-out, opacity ${FLY_MS}ms ease-out` : 'none',
                }}
              >
                {renderCard(item)}
              </div>
            )
          })
          .reverse()}
        <div
          key={getKey(top)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn('relative z-10 flex touch-none flex-col rounded-2xl select-none', !bare && 'border bg-card shadow-sm', onOpen && 'cursor-pointer', tall && 'min-h-[58dvh]')}
          style={{
            transform,
            opacity: flying ? 0 : 1,
            transition: animate ? `transform ${FLY_MS}ms ease-out, opacity ${FLY_MS}ms ease-out` : 'none',
          }}
        >
          {renderCard(top)}
          {actions.map((a) => (
            <span
              key={a.dir}
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute top-5 z-10 rounded-lg border-4 bg-card/70 px-3 py-0.5 text-lg font-bold tracking-wide',
                a.dir === 'right' && 'left-5 -rotate-12',
                a.dir === 'left' && 'right-5 rotate-12',
                a.dir === 'up' && 'left-1/2 -translate-x-1/2',
                a.tone,
              )}
              style={{ opacity: hint === a.dir ? strength : 0 }}
            >
              {a.label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        {actions
          .slice()
          .sort((a, b) => ({ left: 0, up: 1, right: 2 })[a.dir] - ({ left: 0, up: 1, right: 2 })[b.dir])
          .map(({ dir, label: text, icon: Icon, tone }) => (
            <button
              key={dir}
              type="button"
              onClick={() => commit(dir)}
              aria-label={text}
              className={cn(
                'flex size-14 items-center justify-center rounded-full border-2 bg-card shadow-sm transition-transform active:scale-90',
                dir === 'up' && 'size-12',
                tone,
              )}
            >
              <Icon className="size-6" aria-hidden="true" />
            </button>
          ))}
      </div>
    </div>
  )
}

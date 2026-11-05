import { forwardRef, useEffect, useImperativeHandle, useRef, type PointerEvent } from 'react'
import { addPoint, drawStroke, scaleStrokes, type Stroke } from '@/features/draw/strokes'
import { cn } from '@/lib/utils'

export type DrawCanvasHandle = { clear: () => void; undo: () => void; isEmpty: () => boolean }

type DrawCanvasProps = {
  color: string
  size: number
  erase: boolean
  label: string
  className?: string
  onChange?: (strokes: number) => void
}

// Finger drawing surface: smooth strokes, undo, clear, sharp on retina, keeps the drawing on rotate.
// Touch scrolling is off inside it (touch-action: none) so drawing never scrolls the page.
export const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(function DrawCanvas({ color, size, erase, label, className, onChange }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const current = useRef<Stroke | null>(null)
  const box = useRef({ w: 0, h: 0 })

  function redraw() {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    const dpr = c.width / Math.max(1, box.current.w)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const s of strokes.current) drawStroke(ctx, s)
    if (current.current) drawStroke(ctx, current.current)
  }

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const fit = () => {
      const rect = c.getBoundingClientRect()
      const dpr = Math.min(3, window.devicePixelRatio || 1)
      const { w, h } = box.current
      if (w && h && (rect.width !== w || rect.height !== h)) strokes.current = scaleStrokes(strokes.current, rect.width / w, rect.height / h)
      box.current = { w: rect.width, h: rect.height }
      c.width = Math.round(rect.width * dpr)
      c.height = Math.round(rect.height * dpr)
      redraw()
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(c)
    return () => observer.disconnect()
  }, [])

  useImperativeHandle(ref, () => ({
    clear() {
      strokes.current = []
      current.current = null
      redraw()
      onChange?.(0)
    },
    undo() {
      strokes.current = strokes.current.slice(0, -1)
      redraw()
      onChange?.(strokes.current.length)
    },
    isEmpty: () => strokes.current.length === 0,
  }))

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={label}
      className={cn('touch-none rounded-3xl bg-card select-none', className)}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        current.current = { color, size, erase, points: [point(e)] }
        redraw()
      }}
      onPointerMove={(e) => {
        if (!current.current) return
        // Coalesced events give smoother lines on fast finger moves (iPhone 120 Hz).
        const coalesced = e.nativeEvent.getCoalescedEvents?.()
        const events = coalesced?.length ? coalesced : [e.nativeEvent]
        const rect = e.currentTarget.getBoundingClientRect()
        let pts = current.current.points
        for (const ev of events) pts = addPoint(pts, { x: ev.clientX - rect.left, y: ev.clientY - rect.top })
        current.current = { ...current.current, points: pts }
        redraw()
      }}
      onPointerUp={() => {
        if (current.current) strokes.current = [...strokes.current, current.current]
        current.current = null
        redraw()
        onChange?.(strokes.current.length)
      }}
      onPointerCancel={() => {
        current.current = null
        redraw()
      }}
    />
  )
})

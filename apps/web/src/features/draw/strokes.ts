// Drawing for วาดแล้วทาย. Pure helpers, tested in strokes.test.ts.

export type Point = { x: number; y: number }
export type Stroke = { color: string; size: number; erase: boolean; points: Point[] }

/** Skip points closer than `min` px to the previous one (less jitter, smaller undo history). */
export function addPoint(points: readonly Point[], p: Point, min = 1.5): Point[] {
  const last = points.at(-1)
  if (last && Math.hypot(p.x - last.x, p.y - last.y) < min) return points as Point[]
  return [...points, p]
}

/** Smooth curve through the points: quadratic segments between midpoints. */
export function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke): void {
  const pts = s.points
  if (!pts.length) return
  ctx.save()
  ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
  ctx.strokeStyle = s.color
  ctx.fillStyle = s.color
  ctx.lineWidth = s.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0].x, pts[0].y, s.size / 2, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      const mid = { x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 }
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mid.x, mid.y)
    }
    const end = pts.at(-1)!
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }
  ctx.restore()
}

/** Scale strokes when the canvas changes size (rotation), so the drawing keeps its place. */
export function scaleStrokes(strokes: readonly Stroke[], fx: number, fy: number): Stroke[] {
  return strokes.map((s) => ({ ...s, size: s.size * Math.min(fx, fy), points: s.points.map((p) => ({ x: p.x * fx, y: p.y * fy })) }))
}

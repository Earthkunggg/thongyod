import { describe, expect, it } from 'vitest'
import { addPoint, scaleStrokes } from './strokes'

describe('strokes', () => {
  it('drops points that are too close', () => {
    const a = addPoint([], { x: 0, y: 0 })
    expect(addPoint(a, { x: 1, y: 0 })).toHaveLength(1)
    expect(addPoint(a, { x: 3, y: 0 })).toHaveLength(2)
  })

  it('scales strokes with the canvas', () => {
    const [s] = scaleStrokes([{ color: '#000', size: 4, erase: false, points: [{ x: 10, y: 20 }] }], 2, 0.5)
    expect(s.points[0]).toEqual({ x: 20, y: 10 })
    expect(s.size).toBe(2)
  })
})

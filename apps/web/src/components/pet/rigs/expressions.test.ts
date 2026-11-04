import { describe, expect, it } from 'vitest'
import { eyes, mouth, part } from './dragon'
import { EXPRESSIONS, EXPRESSION_IDS, lookOffset } from './expressions'

describe('dragon rig', () => {
  it('has every part each expression needs', () => {
    for (const id of EXPRESSION_IDS) {
      const face = EXPRESSIONS[id]
      expect(eyes(face.eyes).l.box).toHaveLength(4)
      expect(eyes(face.eyes).r.box).toHaveLength(4)
      expect(mouth(face.mouth).box).toHaveLength(4)
      if (face.effect) expect(part(face.effect).box).toHaveLength(4)
    }
    for (const name of ['body', 'wing_left', 'wing_right', 'tail']) expect(part(name).src).toBeTruthy()
  })
})

describe('lookOffset', () => {
  it('points toward the pointer and never moves more than max', () => {
    expect(lookOffset(0, 0)).toEqual([0, 0])
    const [x, y] = lookOffset(1000, 0)
    expect(x).toBe(4)
    expect(y).toBe(0)
    const [a, b] = lookOffset(-30, 40)
    expect(Math.hypot(a, b)).toBeLessThanOrEqual(4)
    expect(a).toBeLessThan(0)
    expect(b).toBeGreaterThan(0)
  })
})

import { describe, expect, it } from 'vitest'
import { faceOf, rollDice, seatAt, spinBottle, total, tumble, type Face } from './logic'

describe('dice', () => {
  it('rolls 1–3 dice with faces 1–6', () => {
    const r = rollDice(3)
    expect(r).toHaveLength(3)
    for (const f of r) expect(f >= 1 && f <= 6).toBe(true)
    expect(rollDice(9, () => 5)).toEqual([6, 6, 6])
    expect(total([1, 2, 6])).toBe(9)
  })

  it('tumbles forward and lands on the asked face', () => {
    let rot = { x: 0, y: 0 }
    for (const face of [1, 2, 3, 4, 5, 6, 6, 1] as Face[]) {
      const next = tumble(rot, face)
      expect(next.x).toBeGreaterThanOrEqual(rot.x + 2 * 360 - 180)
      expect(faceOf(next)).toBe(face)
      rot = next
    }
  })
})

describe('bottle', () => {
  it('points at the chosen seat and always spins forward', () => {
    let rot = 0
    for (let i = 0; i < 200; i++) {
      const r = spinBottle(rot, 7)
      expect(r.rotation - rot).toBeGreaterThanOrEqual(4 * 360)
      expect(seatAt(r.rotation, 7)).toBe(r.seat)
      rot = r.rotation
    }
  })

  it('every seat can be chosen', () => {
    const seen = new Set<number | null>()
    for (let i = 0; i < 400; i++) seen.add(spinBottle(0, 5).seat)
    expect(seen.size).toBe(5)
  })

  it('free spin has no seat', () => {
    expect(spinBottle(0, 0).seat).toBeNull()
  })
})

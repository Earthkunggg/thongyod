import { describe, expect, it } from 'vitest'
import { PLAY_ACTIONS, POSES, TAP_ACTIONS, idleDelayMs, isNight, pickIdle, pickOther, planFor, sleepAfterMs, type SpeciesMoves } from './behavior'

const moves: SpeciesMoves = {
  play1: { motion: 'fly', overlay: 'none', ms: 1900 },
  play2: { motion: 'turn', overlay: 'none', ms: 1600 },
  play3: { motion: 'sneeze', overlay: 'puff', ms: 1500 },
}
const seq = (values: number[]) => {
  let i = 0
  return (n: number) => values[i++ % values.length] % n
}

describe('pet behaviour', () => {
  it('has a plan with an existing pose for every action', () => {
    for (const a of [...TAP_ACTIONS, ...PLAY_ACTIONS, 'love', 'eat', 'celebrate', 'yawn', 'sleep'] as const) {
      const p = planFor(a, moves)
      expect(POSES).toContain(p.pose)
      expect(p.ms === 0 ? a === 'sleep' : p.ms >= 1000).toBe(true)
    }
    expect(planFor('play3', moves)).toEqual({ pose: 'play3', motion: 'sneeze', overlay: 'puff', ms: 1500 })
  })

  it('never repeats the last tap reaction', () => {
    let last: (typeof TAP_ACTIONS)[number] | null = null
    for (let i = 0; i < 200; i++) {
      const next: (typeof TAP_ACTIONS)[number] = pickOther(TAP_ACTIONS, last, (n) => Math.floor(Math.random() * n))
      expect(next).not.toBe(last)
      last = next
    }
  })

  it('yawns mostly at night, plays in the day', () => {
    expect(isNight(23)).toBe(true)
    expect(isNight(5)).toBe(true)
    expect(isNight(12)).toBe(false)
    expect(pickIdle(null, 23, seq([0]))).toBe('yawn')
    expect(PLAY_ACTIONS).toContain(pickIdle('play1', 12, seq([5, 0])))
    expect(pickIdle('play1', 12, seq([5, 0]))).not.toBe('play1')
  })

  it('waits a varied time and sleeps sooner at night', () => {
    expect(idleDelayMs(() => 0)).toBe(9000)
    expect(idleDelayMs((n) => n - 1)).toBe(20000)
    expect(sleepAfterMs(23)).toBeLessThan(sleepAfterMs(14))
  })
})

describe('pet motions', () => {
  it('every motion starts and ends at rest and fits inside its plan', async () => {
    const { MOTIONS } = await import('./motions')
    for (const [name, m] of Object.entries(MOTIONS)) {
      expect(m.frames[0].transform, name).toBe('translate(0, 0) rotate(0deg) scale(1, 1)')
      expect(m.frames.at(-1)!.transform, name).toBe('translate(0, 0) rotate(0deg) scale(1, 1)')
      const offsets = m.frames.map((x) => x.offset ?? 0)
      expect([...offsets].sort((a, b) => a - b), name).toEqual(offsets)
      // The drawing swaps on a squashed / thinnest key frame, never on a resting one.
      const atSwap = m.frames.find((x) => x.offset === m.swapAt)
      expect(atSwap, name).toBeDefined()
      expect(atSwap!.transform, name).not.toBe('translate(0, 0) rotate(0deg) scale(1, 1)')
    }
    for (const a of ['happy', 'wave', 'shy', 'love', 'eat', 'celebrate', 'yawn'] as const) {
      const p = planFor(a, moves)
      if (p.motion !== 'none') expect(MOTIONS[p.motion].ms, a).toBeLessThanOrEqual(p.ms)
    }
  })
})

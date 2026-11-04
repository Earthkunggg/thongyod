import { describe, expect, it } from 'vitest'
import { POSITIONS, TAKSA_ORDER, bangkokDay, colorsFor, taksa } from './taksa'

describe('taksa', () => {
  it('starts with the day itself and walks the traditional order', () => {
    const t = taksa('thu')
    expect(t.boriwan).toBe('thu')
    expect(t.ayu).toBe('wedNight')
    expect(t.det).toBe('fri')
    expect(t.sri).toBe('sun')
    expect(t.kalakini).toBe('sat')
  })
  it('uses every planet exactly once from any start', () => {
    for (const start of TAKSA_ORDER) {
      expect(new Set(POSITIONS.map((p) => taksa(start)[p])).size).toBe(8)
    }
  })
  it('the bad-luck day of each day is the one just before it in the order', () => {
    expect(taksa('sun').kalakini).toBe('fri')
    expect(taksa('mon').kalakini).toBe('sun')
    expect(taksa('wedNight').kalakini).toBe('thu')
  })
})

describe('colorsFor', () => {
  it('Thursday: study blue, money red, avoid purple', () => {
    expect(colorsFor('thu')).toEqual({ study: 'blue', money: 'red', helpers: 'green', friends: 'orange', avoid: 'purple' })
  })
})

describe('bangkokDay', () => {
  it('uses the Thai calendar day even near midnight UTC', () => {
    expect(bangkokDay(new Date('2026-11-04T18:30:00Z'))).toBe('thu') // 01:30 Thursday in Bangkok
    expect(bangkokDay(new Date('2026-11-04T16:00:00Z'))).toBe('wed') // 23:00 Wednesday in Bangkok
  })
})

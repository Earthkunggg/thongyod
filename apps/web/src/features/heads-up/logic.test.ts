import { describe, expect, it } from 'vitest'
import { createTiltDetector, pickWords, score, secondsLeft, shuffle, toggleAnswer, type Answer } from './logic'

/** Deterministic "random": always the last index → reversal pattern. */
const last = (max: number) => max - 1

describe('shuffle and pickWords', () => {
  it('keeps every item exactly once', () => {
    const out = shuffle(['a', 'b', 'c', 'd'], (max) => Math.floor(max / 2))
    expect([...out].sort()).toEqual(['a', 'b', 'c', 'd'])
  })
  it('drops duplicates and blanks, and puts used words last', () => {
    const words = pickWords(['ก', 'ข', 'ข', ' ', 'ค', 'ง'], new Set(['ก', 'ค']), last)
    expect(words).toHaveLength(4)
    expect(new Set(words.slice(0, 2))).toEqual(new Set(['ข', 'ง']))
    expect(new Set(words.slice(2))).toEqual(new Set(['ก', 'ค']))
  })
})

describe('score and toggle', () => {
  const answers: Answer[] = [
    { word: 'หมา', verdict: 'correct' },
    { word: 'แมว', verdict: 'pass' },
  ]
  it('counts correct answers and swaps one verdict', () => {
    expect(score(answers)).toBe(1)
    const fixed = toggleAnswer(answers, 1)
    expect(score(fixed)).toBe(2)
    expect(answers[1].verdict).toBe('pass') // original untouched
  })
})

describe('createTiltDetector', () => {
  function calibrated(opts = {}) {
    const d = createTiltDetector(opts)
    for (let i = 0; i < 10; i++) d.calibrate(0.5)
    return d
  }
  it('does nothing before calibration', () => {
    expect(createTiltDetector().feed(-9, 0)).toBeNull()
  })
  it('nod down = correct, tilt back = pass', () => {
    expect(calibrated().feed(-7, 1000)).toBe('correct')
    expect(calibrated().feed(8, 1000)).toBe('pass')
  })
  it('ignores small wobbles', () => {
    const d = calibrated()
    for (const z of [2, -2, 3.5, -4]) expect(d.feed(z, 1000)).toBeNull()
  })
  it('fires once per tilt: needs to come back to neutral and wait the cooldown', () => {
    const d = calibrated()
    expect(d.feed(-8, 1000)).toBe('correct')
    expect(d.feed(-9, 1100)).toBeNull() // still tilted
    expect(d.feed(0.5, 1200)).toBeNull() // back, but inside the 400 ms cooldown
    expect(d.feed(-8, 1300)).toBeNull() // not re-armed yet
    expect(d.feed(0.5, 1500)).toBeNull() // back after the cooldown → re-armed
    expect(d.feed(-8, 1600)).toBe('correct')
  })
  it('can swap directions', () => {
    expect(calibrated({ inverted: true }).feed(-7, 1000)).toBe('pass')
  })
})

describe('secondsLeft', () => {
  it('counts down, rounds up, never below zero, and adds paused time', () => {
    expect(secondsLeft(0, 60, 0)).toBe(60)
    expect(secondsLeft(0, 60, 59_001)).toBe(1)
    expect(secondsLeft(0, 60, 61_000)).toBe(0)
    expect(secondsLeft(0, 60, 61_000, 5_000)).toBe(4)
  })
})

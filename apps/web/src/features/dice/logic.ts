// ลูกเต๋า & ปั่นขวด. Pure logic, tested in logic.test.ts. Result first (fair random), then animate to it.
import { secureRandomInt } from '@/lib/random'

export type Face = 1 | 2 | 3 | 4 | 5 | 6

export function rollDice(count: number, random: (max: number) => number = secureRandomInt): Face[] {
  return Array.from({ length: Math.max(1, Math.min(3, count)) }, () => (random(6) + 1) as Face)
}

/** Cube rotation (deg) that shows `face` to the viewer. Faces: 1 front, 6 back, 2 top, 5 bottom, 3 right, 4 left. */
const FACE_ROTATION: Record<Face, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  6: { x: 0, y: 180 },
  2: { x: -90, y: 0 },
  5: { x: 90, y: 0 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
}

/**
 * Next rotation for a die: always tumbles forward by at least `spins` full turns from `from`, then lands on `face`.
 * Returns absolute angles so CSS transitions never spin backwards.
 */
export function tumble(from: { x: number; y: number }, face: Face, spins = 2): { x: number; y: number } {
  const target = FACE_ROTATION[face]
  const next = (current: number, want: number) => {
    const base = Math.ceil((current + spins * 360 - want) / 360) * 360
    return base + want
  }
  return { x: next(from.x, target.x), y: next(from.y, target.y) }
}

/** Which face a rotation shows (used by tests and the screen reader text). */
export function faceOf(rot: { x: number; y: number }): Face {
  const norm = (a: number) => ((Math.round(a) % 360) + 360) % 360
  const x = norm(rot.x)
  const y = norm(rot.y)
  for (const [face, r] of Object.entries(FACE_ROTATION)) if (norm(r.x) === x && norm(r.y) === y) return Number(face) as Face
  return 1
}

export const total = (faces: readonly Face[]) => faces.reduce((n, f) => n + f, 0)

/**
 * Spin the bottle: pick the seat first, then an angle inside that seat's slice (away from the borders),
 * plus 4–6 full turns forward from the current rotation. Seat 0 is at the top, going clockwise.
 * With seats = 0 the bottle just stops at a random angle.
 */
export function spinBottle(from: number, seats: number, random: (max: number) => number = secureRandomInt): { rotation: number; seat: number | null } {
  const turns = 4 + random(3)
  let angle: number
  let seat: number | null = null
  if (seats >= 2) {
    seat = random(seats)
    const slice = 360 / seats
    const jitter = (random(1000) / 1000 - 0.5) * slice * 0.6
    angle = seat * slice + jitter
  } else {
    angle = random(360)
  }
  const current = ((from % 360) + 360) % 360
  const target = ((angle % 360) + 360) % 360
  const delta = ((target - current + 360) % 360) + turns * 360
  return { rotation: from + delta, seat }
}

/** Which seat a bottle rotation points at. */
export function seatAt(rotation: number, seats: number): number {
  const slice = 360 / seats
  const a = (((rotation % 360) + 360) % 360 + slice / 2) % 360
  return Math.floor(a / slice)
}

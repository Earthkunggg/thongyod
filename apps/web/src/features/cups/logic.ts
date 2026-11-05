// ขนมอยู่ไหน (cups game). Pure logic, tested in logic.test.ts.
// The swaps are decided first with the fair random source; the screen only animates them.
import { secureRandomInt } from '@/lib/random'

export type Swap = readonly [number, number]

/** Cups on screen: 3, then 4 from level 4, 5 from level 8. */
export const cupCount = (level: number) => (level >= 8 ? 5 : level >= 4 ? 4 : 3)
/** More swaps every level. */
export const swapCount = (level: number) => 4 + level * 2
/** Faster every level, never quicker than the eye can follow. */
export const stepMs = (level: number) => Math.max(200, 560 - level * 40)

/** `count` swaps of two different slots each. */
export function makeSwaps(cups: number, count: number, random: (max: number) => number = secureRandomInt): Swap[] {
  const out: Swap[] = []
  for (let i = 0; i < count; i++) {
    const a = random(cups)
    let b = random(cups - 1)
    if (b >= a) b += 1
    out.push([a, b])
  }
  return out
}

/** slots[i] = id of the cup standing in slot i. Swapping two slots swaps their cups. */
export function applySwap(slots: readonly number[], [a, b]: Swap): number[] {
  const next = [...slots]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

/** Slot of a cup after all swaps. */
export function finalSlot(cups: number, swaps: readonly Swap[], cupId: number): number {
  const slots = swaps.reduce(applySwap, Array.from({ length: cups }, (_, i) => i))
  return slots.indexOf(cupId)
}

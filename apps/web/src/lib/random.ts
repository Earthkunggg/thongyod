// Fair randomness for games and tools (UX_GUIDELINES: decide the result first, then animate to it).

/**
 * Random integer in [0, max) from the browser's secure random source.
 * Uses rejection sampling so every value is equally likely.
 */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new Error(`max must be a positive integer, got ${max}`)
  const limit = Math.floor(0x1_0000_0000 / max) * max
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    if (buffer[0] < limit) return buffer[0] % max
  }
}

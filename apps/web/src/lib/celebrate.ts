// Confetti for peak moments only (UX_GUIDELINES: delight at peaks, calm in between).
// canvas-confetti 1.9.4, ISC license. Skipped when the user prefers reduced motion.
import confetti from 'canvas-confetti'

export function celebrate(): void {
  void confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 38,
    origin: { y: 0.65 },
    disableForReducedMotion: true,
  })
}

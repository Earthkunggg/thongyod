// Body motions for the pet (DECISIONS #80): Web Animations keyframes on one wrapper, transform only,
// so they never restart the pose images and stay smooth on iPhone. Transform origin = bottom centre.
// Every motion starts and ends at rest, so it can be cut in at any time without a jump.
import type { Motion } from './behavior'

type Frame = { transform: string; offset?: number }
export type MotionSpec = {
  ms: number
  frames: Frame[]
  /**
   * When to swap the pose drawing (share of ms): at the most squashed frame, or the thinnest moment of a turn,
   * so the change of drawing is hidden inside the motion (a cross-fade would show two drawings at once).
   */
  swapAt: number
  /** Shadow scale while airborne. */
  shadow?: Frame[]
}

const rest = 'translate(0, 0) rotate(0deg) scale(1, 1)'
const f = (offset: number, transform: string): Frame => ({ offset, transform })

const SQUASH = 'translate(0, 0) rotate(0deg) scale(1.08, 0.91)'

export const MOTIONS: Record<Exclude<Motion, 'none'> | 'settle', MotionSpec> = {
  // Back to the main pose (and any pose change without its own move): a small squash hides the swap.
  settle: { ms: 360, swapAt: 0.35, frames: [f(0, rest), f(0.35, SQUASH), f(0.7, 'translate(0, 0) rotate(0deg) scale(0.98, 1.02)'), f(1, rest)] },
  squish: { ms: 450, swapAt: 0.3, frames: [f(0, rest), f(0.3, 'translate(0, 0) rotate(0deg) scale(1.1, 0.88)'), f(0.6, 'translate(0, 0) rotate(0deg) scale(0.96, 1.05)'), f(1, rest)] },
  hop: {
    ms: 1100,
    swapAt: 0.15,
    frames: [
      f(0, rest),
      f(0.15, 'translate(0, 0) rotate(0deg) scale(1.1, 0.88)'),
      f(0.4, 'translate(0, -14%) rotate(0deg) scale(0.96, 1.05)'),
      f(0.62, 'translate(0, 0) rotate(0deg) scale(1.08, 0.92)'),
      f(0.8, 'translate(0, 0) rotate(0deg) scale(0.98, 1.02)'),
      f(1, rest),
    ],
    shadow: [{ transform: 'scale(1)', offset: 0 }, { transform: 'scale(0.8)', offset: 0.4 }, { transform: 'scale(1)', offset: 0.62 }, { transform: 'scale(1)', offset: 1 }],
  },
  wave: {
    ms: 1500,
    swapAt: 0.08,
    frames: [f(0, rest), f(0.08, SQUASH), f(0.2, 'translate(0, 0) rotate(-3deg) scale(1, 1)'), f(0.4, 'translate(0, 0) rotate(2.5deg) scale(1, 1)'), f(0.6, 'translate(0, 0) rotate(-2.5deg) scale(1, 1)'), f(0.8, 'translate(0, 0) rotate(2deg) scale(1, 1)'), f(1, rest)],
  },
  shy: { ms: 1500, swapAt: 0.08, frames: [f(0, rest), f(0.08, SQUASH), f(0.25, 'translate(0, 2%) rotate(-3deg) scale(0.97, 0.97)'), f(0.75, 'translate(0, 2%) rotate(-3deg) scale(0.97, 0.97)'), f(1, rest)] },
  fly: {
    ms: 1900,
    swapAt: 0.12,
    frames: [
      f(0, rest),
      f(0.12, 'translate(0, 0) rotate(0deg) scale(1.08, 0.9)'),
      f(0.3, 'translate(0, -16%) rotate(-3deg) scale(1, 1)'),
      f(0.5, 'translate(0, -20%) rotate(2deg) scale(1, 1)'),
      f(0.7, 'translate(0, -15%) rotate(-2deg) scale(1, 1)'),
      f(0.88, 'translate(0, 0) rotate(0deg) scale(1.06, 0.94)'),
      f(1, rest),
    ],
    shadow: [{ transform: 'scale(1)', offset: 0 }, { transform: 'scale(0.72)', offset: 0.5 }, { transform: 'scale(1)', offset: 0.88 }, { transform: 'scale(1)', offset: 1 }],
  },
  dash: {
    ms: 1700,
    swapAt: 0.08,
    frames: [f(0, rest), f(0.08, SQUASH), f(0.25, 'translate(-9%, 0) rotate(-4deg) scale(1, 1)'), f(0.5, 'translate(7%, 0) rotate(3deg) scale(1, 1)'), f(0.75, 'translate(-3%, 0) rotate(-1deg) scale(1, 1)'), f(1, rest)],
  },
  // Turns around: a squeeze through the middle into its mirror image and back (a 2D drawing "turning").
  turn: {
    ms: 1500,
    swapAt: 0.18,
    frames: [f(0, rest), f(0.18, 'translate(0, 0) rotate(0deg) scale(0.12, 1)'), f(0.3, 'translate(0, 0) rotate(0deg) scale(-1, 1)'), f(0.7, 'translate(0, 0) rotate(0deg) scale(-1, 1)'), f(0.82, 'translate(0, 0) rotate(0deg) scale(-0.12, 1)'), f(1, rest)],
  },
  sneeze: {
    ms: 1400,
    swapAt: 0.08,
    frames: [f(0, rest), f(0.08, SQUASH), f(0.3, 'translate(3%, 0) rotate(3deg) scale(1.04, 0.96)'), f(0.45, 'translate(-4%, 0) rotate(-4deg) scale(0.94, 1.06)'), f(0.6, 'translate(1%, 0) rotate(1deg) scale(1, 1)'), f(1, rest)],
  },
  jump: {
    ms: 1600,
    swapAt: 0.15,
    frames: [
      f(0, rest),
      f(0.15, 'translate(0, 0) rotate(0deg) scale(1.08, 0.92)'),
      f(0.45, 'translate(0, -22%) rotate(-8deg) scale(1, 1)'),
      f(0.7, 'translate(0, -4%) rotate(4deg) scale(1, 1)'),
      f(0.82, 'translate(0, 0) rotate(0deg) scale(1.06, 0.94)'),
      f(1, rest),
    ],
    shadow: [{ transform: 'scale(1)', offset: 0 }, { transform: 'scale(0.7)', offset: 0.45 }, { transform: 'scale(1)', offset: 0.82 }, { transform: 'scale(1)', offset: 1 }],
  },
  chomp: {
    ms: 1800,
    swapAt: 0.15,
    frames: [f(0, rest), f(0.15, 'translate(0, 0) rotate(0deg) scale(1.04, 0.95)'), f(0.3, rest), f(0.45, 'translate(0, 0) rotate(0deg) scale(1.04, 0.95)'), f(0.6, rest), f(0.75, 'translate(0, 0) rotate(0deg) scale(1.03, 0.96)'), f(1, rest)],
  },
  dance: {
    ms: 2400,
    swapAt: 0.06,
    frames: [
      f(0, rest),
      f(0.06, SQUASH),
      f(0.125, 'translate(0, -6%) rotate(-5deg) scale(1, 1)'),
      f(0.25, 'translate(0, 0) rotate(0deg) scale(1.04, 0.96)'),
      f(0.375, 'translate(0, -6%) rotate(5deg) scale(1, 1)'),
      f(0.5, 'translate(0, 0) rotate(0deg) scale(1.04, 0.96)'),
      f(0.625, 'translate(0, -6%) rotate(-5deg) scale(1, 1)'),
      f(0.75, 'translate(0, 0) rotate(0deg) scale(1.04, 0.96)'),
      f(0.875, 'translate(0, -6%) rotate(5deg) scale(1, 1)'),
      f(1, rest),
    ],
    shadow: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((offset, i) => ({ offset, transform: i % 2 ? 'scale(0.88)' : 'scale(1)' })),
  },
  stretch: { ms: 1900, swapAt: 0.1, frames: [f(0, rest), f(0.1, SQUASH), f(0.4, 'translate(0, 0) rotate(0deg) scale(0.97, 1.07)'), f(0.7, 'translate(0, 0) rotate(0deg) scale(1.02, 0.98)'), f(1, rest)] },
}

// Layered dragon rig (DECISIONS #67). Parts are our vector traces of image/01-dragon-parts.png
// (cut by alpha, upscaled ×3, traced with vtracer (MIT), optimized with svgo (MIT)).
// Boxes are [x, y, w, h] in reference units on a 380 × 472 canvas; they were measured by
// matching each part against the finished drawing on the same sheet (see HANDOFF).

const files = import.meta.glob<string>('@/assets/pets/dragon-rig/*.svg', { eager: true, query: '?url', import: 'default' })
const src = (name: string) => files[`/src/assets/pets/dragon-rig/${name}.svg`]

export type Box = [number, number, number, number]
export type EyeSet = 'open' | 'sulky' | 'closed' | 'happy' | 'sparkle' | 'teary'
export type MouthId = 'o_small' | 'open' | 'grin' | 'grin_wide' | 'pout' | 'cat' | 'laugh' | 'shout' | 'wavy' | 'tiny'
export type Effect = 'sweat' | 'anger'

export const CANVAS = { w: 380, h: 472 }

/** Where each moving part turns (reference units): wing roots at the shoulders, tail root at the hip. */
export const PIVOTS = {
  wingLeft: [128, 318] as const,
  wingRight: [232, 312] as const,
  tail: [272, 420] as const,
  /** Breathing/squish origin: between the feet. */
  ground: [190, 452] as const,
}

const BOXES: Record<string, Box> = {
  body: [25, 17, 334, 439.0],
  wing_left: [27, 271, 111, 80.3],
  wing_right: [227, 258, 134, 94.5],
  tail: [269, 364, 74, 68.2],
  eyes_open_l: [63.9, 161.0, 56.2, 48.0],
  eyes_open_r: [164.1, 176.8, 79.7, 46.4],
  eyes_sulky_l: [61.5, 163.8, 61.1, 42.5],
  eyes_sulky_r: [163.3, 178.8, 81.3, 42.5],
  eyes_closed_l: [60.0, 171.8, 64.0, 26.5],
  eyes_closed_r: [168.4, 187.8, 71.2, 24.5],
  eyes_happy_l: [63.1, 170.5, 57.8, 29.1],
  eyes_happy_r: [173.9, 184.3, 60.1, 31.4],
  eyes_sparkle_l: [63.9, 158.2, 56.2, 53.6],
  eyes_sparkle_r: [164.3, 173.5, 79.4, 52.9],
  eyes_teary_l: [63.4, 153.6, 57.2, 62.7],
  eyes_teary_r: [164.1, 169.1, 79.7, 61.7],
  mouth_o_small: [94.0, 211.6, 52.0, 36.8],
  mouth_open: [89.2, 212.0, 61.6, 36.0],
  mouth_grin: [91.2, 214.8, 57.6, 30.4],
  mouth_grin_wide: [88.8, 215.2, 62.4, 29.6],
  mouth_pout: [103.6, 214.8, 32.8, 30.4],
  mouth_cat: [97.2, 223.2, 45.6, 13.6],
  mouth_laugh: [90.0, 207.6, 60.0, 44.8],
  mouth_shout: [96.8, 204.8, 46.4, 50.4],
  mouth_wavy: [91.2, 220.4, 57.6, 19.2],
  mouth_tiny: [105.2, 212.8, 29.6, 34.4],
  sweat: [250.0, 121.2, 24.0, 37.5],
  anger: [248.9, 76.9, 46.2, 46.2],
}

export type RigPart = { src: string; box: Box }

export function part(name: string): RigPart {
  const box = BOXES[name]
  const url = src(name)
  if (!box || !url) throw new Error(`dragon rig: missing part ${name}`)
  return { src: url, box }
}

export const eyes = (set: EyeSet) => ({ l: part(`eyes_${set}_l`), r: part(`eyes_${set}_r`) })
export const mouth = (id: MouthId) => part(`mouth_${id}`)

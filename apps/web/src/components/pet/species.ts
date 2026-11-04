// Pet species config (DECISIONS #47). Art = our vector traces of image/*-sheet-v1.png
// (vtracer, MIT; optimized with svgo, MIT). Overlay coordinates use each species' main-pose viewBox.
import dragonHop from '@/assets/pets/dragon/hop.svg'
import dragonLie from '@/assets/pets/dragon/lie.svg'
import dragonStand from '@/assets/pets/dragon/stand.svg'
import fishMain from '@/assets/pets/fish/main.svg'
import fishSleep from '@/assets/pets/fish/sleep.svg'
import fishSwim from '@/assets/pets/fish/swim.svg'

export type PetSpeciesId = 'dragon' | 'fish'

/** One pose image; `width` is relative to the main pose box so the pet keeps its size. */
type PoseImage = { src: string; width: string }

export type PetSpecies = {
  id: PetSpeciesId
  /** Main pose canvas (overlays are drawn in these coordinates). */
  box: { w: number; h: number }
  poses: { main: PoseImage; tap: PoseImage; mid: PoseImage; sleep: PoseImage | null }
  /** Always-on motion: breathing (on the ground) or floating (in the air). */
  alive: 'breathe' | 'float'
  /** 30 s idle action. */
  mid: 'fly' | 'swim'
  /** 15 s idle overlay. */
  short: 'puff' | 'bubbles'
  /** Eyelids drawn over the main pose for blinking (and sleeping when there is no sleep pose). */
  lids: { fill: string; stroke: string; width: number; ellipses: [number, number, number, number][]; lines: string[] }
  /** Where idle overlays start. */
  anchors: { short: [number, number]; z: [number, number]; sparks: [number, number, number][] }
}

export const PET_SPECIES: Record<PetSpeciesId, PetSpecies> = {
  dragon: {
    id: 'dragon',
    box: { w: 1160, h: 800 },
    poses: {
      main: { src: dragonLie, width: '100%' },
      tap: { src: dragonStand, width: '70%' },
      mid: { src: dragonHop, width: '74%' },
      sleep: null,
    },
    alive: 'breathe',
    mid: 'fly',
    short: 'puff',
    lids: {
      fill: '#FC8E99',
      stroke: '#8E2F3B',
      width: 14,
      ellipses: [
        [300, 460, 104, 76],
        [624, 482, 128, 74],
      ],
      lines: ['M215 470 Q300 510 385 470', 'M515 492 Q622 532 728 488'],
    },
    anchors: {
      short: [170, 190],
      z: [760, 150],
      sparks: [
        [160, 120, 28],
        [900, 140, 21],
        [980, 300, 16],
      ],
    },
  },
  fish: {
    id: 'fish',
    box: { w: 1016, h: 870 },
    poses: {
      main: { src: fishMain, width: '100%' },
      tap: { src: fishSwim, width: '74%' },
      mid: { src: fishSwim, width: '74%' },
      sleep: { src: fishSleep, width: '76%' },
    },
    alive: 'float',
    mid: 'swim',
    short: 'bubbles',
    lids: {
      fill: '#FDF1E5',
      stroke: '#7A4560',
      width: 12,
      ellipses: [
        [170, 472, 62, 52],
        [463, 484, 80, 56],
      ],
      lines: ['M118 482 Q176 512 234 482', 'M392 494 Q462 526 534 494'],
    },
    anchors: {
      short: [300, 470],
      z: [700, 260],
      sparks: [
        [120, 300, 26],
        [820, 160, 20],
        [880, 620, 16],
      ],
    },
  },
}

/** Narrow an unknown species string from the API (null = not one we can draw). */
export function asSpecies(value: string | null | undefined): PetSpeciesId | null {
  return value === 'dragon' || value === 'fish' ? value : null
}

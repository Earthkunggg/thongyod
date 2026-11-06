// Pet species (DECISIONS #47, #80). Art: Earth's pose sheets (image/13-dragon-poses.png, image/14-fish-poses.png),
// cut into 12 poses each, placed on ONE canvas per species (same scale, same baseline, centred on the body),
// traced (vtracer, MIT) and rendered to WebP at 720 px wide. Every pose image has the same size, so switching
// poses can never make the pet bigger, smaller or jump sideways. Re-run the pipeline in docs/HANDOFF.md for new art.
import dragonMain from '@/assets/pets/v2/dragon/main.webp'
import dragonBlink from '@/assets/pets/v2/dragon/blink.webp'
import dragonHappy from '@/assets/pets/v2/dragon/happy.webp'
import dragonWave from '@/assets/pets/v2/dragon/wave.webp'
import dragonShy from '@/assets/pets/v2/dragon/shy.webp'
import dragonPlay1 from '@/assets/pets/v2/dragon/play1.webp'
import dragonPlay2 from '@/assets/pets/v2/dragon/play2.webp'
import dragonPlay3 from '@/assets/pets/v2/dragon/play3.webp'
import dragonSleep from '@/assets/pets/v2/dragon/sleep.webp'
import dragonEat from '@/assets/pets/v2/dragon/eat.webp'
import dragonCelebrate from '@/assets/pets/v2/dragon/celebrate.webp'
import dragonYawn from '@/assets/pets/v2/dragon/yawn.webp'
import fishMain from '@/assets/pets/v2/fish/main.webp'
import fishBlink from '@/assets/pets/v2/fish/blink.webp'
import fishHappy from '@/assets/pets/v2/fish/happy.webp'
import fishWave from '@/assets/pets/v2/fish/wave.webp'
import fishShy from '@/assets/pets/v2/fish/shy.webp'
import fishPlay1 from '@/assets/pets/v2/fish/play1.webp'
import fishPlay2 from '@/assets/pets/v2/fish/play2.webp'
import fishPlay3 from '@/assets/pets/v2/fish/play3.webp'
import fishSleep from '@/assets/pets/v2/fish/sleep.webp'
import fishEat from '@/assets/pets/v2/fish/eat.webp'
import fishCelebrate from '@/assets/pets/v2/fish/celebrate.webp'
import fishYawn from '@/assets/pets/v2/fish/yawn.webp'
import type { PoseId, SpeciesMoves } from '@/features/pet/behavior'

export type PetSpeciesId = 'dragon' | 'fish'

/** A point on the art, as a share of its width / height (0–1). */
type At = [number, number]

export type PetSpecies = {
  id: PetSpeciesId
  /** Art canvas width / height (all poses share it). */
  aspect: number
  poses: Record<PoseId, string>
  /** Always-on motion: breathing on the ground, or floating. */
  alive: 'breathe' | 'float'
  /** What the three play poses do. */
  moves: SpeciesMoves
  /** Where little drawings start: mouth (puff, bubbles, crumbs), top of the head (hearts, sparks, z). */
  anchors: { mouth: At; head: At; /** Poses whose mouth is somewhere else (tilted drawings). */ mouthIn?: Partial<Record<PoseId, At>> }
}

export const PET_SPECIES: Record<PetSpeciesId, PetSpecies> = {
  dragon: {
    id: 'dragon',
    aspect: 306 / 247,
    poses: { main: dragonMain, blink: dragonBlink, happy: dragonHappy, wave: dragonWave, shy: dragonShy, play1: dragonPlay1, play2: dragonPlay2, play3: dragonPlay3, sleep: dragonSleep, eat: dragonEat, celebrate: dragonCelebrate, yawn: dragonYawn },
    alive: 'breathe',
    moves: {
      play1: { motion: 'fly', overlay: 'none', ms: 1900 },
      play2: { motion: 'turn', overlay: 'none', ms: 1500 },
      play3: { motion: 'sneeze', overlay: 'puff', ms: 1500 },
    },
    anchors: { mouth: [0.34, 0.74], head: [0.42, 0.08] },
  },
  fish: {
    id: 'fish',
    aspect: 314 / 275,
    poses: { main: fishMain, blink: fishBlink, happy: fishHappy, wave: fishWave, shy: fishShy, play1: fishPlay1, play2: fishPlay2, play3: fishPlay3, sleep: fishSleep, eat: fishEat, celebrate: fishCelebrate, yawn: fishYawn },
    alive: 'float',
    moves: {
      play1: { motion: 'dash', overlay: 'bubbles', ms: 1700 },
      play2: { motion: 'turn', overlay: 'none', ms: 1500 },
      play3: { motion: 'jump', overlay: 'bubbles', ms: 1600 },
    },
    anchors: { mouth: [0.32, 0.62], head: [0.48, 0.1], mouthIn: { play1: [0.22, 0.71], play3: [0.33, 0.35], eat: [0.33, 0.7] } },
  },
}

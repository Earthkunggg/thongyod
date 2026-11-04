// First-run state (DECISIONS #46/#47). Kept on this device until the profile/pet API exists.
import type { PetSpeciesId } from '@/components/pet/species'

const ONBOARDED_KEY = 'thongyod-onboarded'
const PET_KEY = 'thongyod-pet'

export type MyPet = { species: PetSpeciesId; hatchedAt: string }

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage blocked: onboarding may show again next visit. Not harmful.
  }
}

export const isOnboarded = () => read(ONBOARDED_KEY) === '1'
export const finishOnboarding = () => write(ONBOARDED_KEY, '1')

export function getMyPet(): MyPet | null {
  try {
    const value = JSON.parse(read(PET_KEY) ?? 'null') as MyPet | null
    return value && (value.species === 'dragon' || value.species === 'fish') ? value : null
  } catch {
    return null
  }
}

export const saveMyPet = (species: PetSpeciesId) => write(PET_KEY, JSON.stringify({ species, hatchedAt: new Date().toISOString() }))

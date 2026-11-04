import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pet, type PetAct, type PetHandle } from '@/components/pet/Pet'
import type { PetSpeciesId } from '@/components/pet/species'
import { Button } from '@/components/ui/button'
import { getMyPet } from '@/features/onboarding/storage'

// Tab "สัตว์เลี้ยง" — pet preview while we test the first 2 species (DECISIONS #47). Full room in M5.
export function PetPage() {
  const { t } = useTranslation()
  const pet = useRef<PetHandle>(null)
  const [species, setSpecies] = useState<PetSpeciesId>(() => getMyPet()?.species ?? 'dragon')
  const demo: { act: PetAct; label: string }[] = [
    { act: 'short', label: t('pet.demo.short') },
    { act: 'mid', label: t('pet.demo.mid') },
    { act: 'sleep', label: t('pet.demo.sleep') },
    { act: 'idle', label: t('pet.demo.wake') },
  ]

  return (
    <>
      <PageHeader title={t('pages.pet.title')} subtitle={t('pet.hint')} />
      <div className="flex flex-col items-center gap-6 px-4 pt-4">
        <div className="w-full">
          <SegmentedChoice<PetSpeciesId>
            label={t('pet.chooseSpecies')}
            value={species}
            onChange={setSpecies}
            options={[
              { value: 'dragon', label: t('pet.species.dragon') },
              { value: 'fish', label: t('pet.species.fish') },
            ]}
          />
        </div>
        <Pet key={species} species={species} size={280} ref={pet} />
        {/* Development only: jump to each idle action instead of waiting. */}
        {import.meta.env.DEV && (
          <div className="grid w-full grid-cols-2 gap-2">
            {demo.map(({ act, label }) => (
              <Button key={act} variant="outline" className="bg-card" onClick={() => pet.current?.run(act)}>
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

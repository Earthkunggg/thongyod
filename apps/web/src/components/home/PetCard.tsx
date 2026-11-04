import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { LuckyColorKey, PetMood, PetSummary } from '@thongyod/shared'
import { LUCKY_HEX } from '@/config/luckyColors'
import { PawPrint } from 'lucide-react'
import { Pet } from '@/components/pet/Pet'
import { asSpecies, type PetSpeciesId } from '@/components/pet/species'

const MOOD_HINT = {
  happy: 'pet.hints.play',
  normal: 'pet.hints.play',
  missing_you: 'pet.hints.visit',
  sulking: 'pet.hints.makeUp',
  wilting: 'pet.hints.makeUp',
} as const satisfies Record<PetMood, string>

type PetCardProps = {
  pet: PetSummary
  luckyColor: LuckyColorKey | null
  /** Where tapping goes. null = not tappable (e.g. a friend's pet on their profile). */
  to?: string | null
  /** Overrides pet.species (my own pet lives on this device until the pet API exists). */
  species?: PetSpeciesId | null
}

// Small pet card (profiles): the animated pet, its mood and the lucky color. Tapping opens the pet room.
export function PetCard({ pet, luckyColor, to = '/pet', species }: PetCardProps) {
  const { t } = useTranslation()
  const kind = species ?? asSpecies(pet.species)
  const classes = 'flex items-center gap-3 rounded-xl border bg-card p-3 text-card-foreground'
  const content = (
    <>
      {kind ? (
        <Pet species={kind} size={56} className="shrink-0" />
      ) : (
        <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
          <PawPrint className="size-6" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {pet.name ?? (kind ? t(`pet.species.${kind}`) : t('pet.defaultName'))} · {t(`pet.moods.${pet.mood}`)}
        </span>
        {to && <span className="block text-xs text-muted-foreground">{t(MOOD_HINT[pet.mood])}</span>}
      </span>
      {luckyColor && (
        <span className="text-right">
          <span className="block text-xs text-muted-foreground">{t('pet.luckyColorToday')}</span>
          <span className="flex items-center justify-end gap-1 text-sm">
            <span
              className="size-2.5 rounded-full border"
              style={{ backgroundColor: LUCKY_HEX[luckyColor] }}
              aria-hidden="true"
            />
            {t(`colors.${luckyColor}`)}
          </span>
        </span>
      )}
    </>
  )
  return to ? (
    <Link to={to} className={`${classes} active:opacity-80`}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  )
}

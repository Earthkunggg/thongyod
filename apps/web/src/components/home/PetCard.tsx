import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { LuckyColorKey, PetMood, PetSummary } from '@thongyod/shared'
import { PetCat } from '@/components/pet/PetCat'

const MOOD_HINT = {
  happy: 'pet.hints.play',
  normal: 'pet.hints.play',
  missing_you: 'pet.hints.visit',
  sulking: 'pet.hints.makeUp',
  wilting: 'pet.hints.makeUp',
} as const satisfies Record<PetMood, string>

/** Swatch color for each lucky color key. */
const LUCKY_HEX: Record<LuckyColorKey, string> = {
  red: '#e24b4a',
  orange: '#f08a24',
  yellow: '#f2c230',
  green: '#3b9b4f',
  blue: '#378add',
  purple: '#7f77dd',
  pink: '#d4537e',
  black: '#2c2c2a',
  white: '#ffffff',
  gray: '#888780',
}

type PetCardProps = {
  pet: PetSummary
  luckyColor: LuckyColorKey | null
  /** Where tapping goes. null = not tappable (e.g. a friend's pet on their profile). */
  to?: string | null
}

// Small pet card on Home. Tapping opens the pet room.
export function PetCard({ pet, luckyColor, to = '/pet' }: PetCardProps) {
  const { t } = useTranslation()
  const classes = 'flex items-center gap-3 rounded-xl border bg-card p-3 text-card-foreground'
  const content = (
    <>
      <PetCat />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {pet.name ?? t('pet.defaultName')} · {t(`pet.moods.${pet.mood}`)}
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

import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Bell, Flame } from 'lucide-react'
import { Egg } from '@/components/pet/Egg'
import { Pet } from '@/components/pet/Pet'
import type { PetSpeciesId } from '@/components/pet/species'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/common/Badge'

type Props = { name: string | null; species: PetSpeciesId | null; streak: number; onPetTap: () => void; now: Date }

function greetingKey(hour: number) {
  if (hour >= 5 && hour < 12) return 'home.greeting.morning'
  if (hour >= 12 && hour < 17) return 'home.greeting.afternoon'
  if (hour >= 17 && hour < 21) return 'home.greeting.evening'
  return 'home.greeting.night'
}

// Top of Home: my pet (always moving, tap to play), a greeting, the streak and notifications.
export function HomeGreeting({ name, species, streak, onPetTap, now }: Props) {
  const { t } = useTranslation()
  return (
    <header className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      {species ? (
        <Pet species={species} size={64} onTap={onPetTap} className="shrink-0" />
      ) : (
        <Link to="/welcome?step=egg" aria-label={t('pet.hatchNow')} className="shrink-0">
          <Egg style="mystery" className="h-14" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{t(greetingKey(now.getHours()))}</p>
        <h1 className="truncate text-xl font-medium">{name ?? ' '}</h1>
      </div>
      {streak >= 2 && (
        <span title={t('home.streakHint')}>
          <Badge tone="warning" icon={Flame}>
            {t('home.streak', { count: streak })}
          </Badge>
        </span>
      )}
      <Button variant="ghost" size="icon" aria-label={t('common.notifications')}>
        <Bell />
      </Button>
    </header>
  )
}

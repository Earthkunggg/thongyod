import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Check, HelpCircle, X } from 'lucide-react'
import { ModeChoice } from '@/components/common/ModeChoice'
import { SwipeDeck, type SwipeAction, type SwipeDir } from '@/components/common/SwipeDeck'
import { Egg, type EggStyle } from '@/components/pet/Egg'
import { Pet } from '@/components/pet/Pet'
import type { PetSpeciesId } from '@/components/pet/species'
import { Button } from '@/components/ui/button'
import { finishOnboarding, getMyPet, saveMyPet } from '@/features/onboarding/storage'
import { secureRandomInt } from '@/lib/random'
import { getMode, getTheme, setMode, setTheme, type Mode, type Theme } from '@/lib/theme'
import { cn } from '@/lib/utils'

// First launch (DECISIONS #46/#47, UX_GUIDELINES §7): ≤ 4 screens, skippable, ends with the pet hatch.
const STEPS = 4
const EGGS: { style: EggStyle; species: PetSpeciesId | null }[] = [
  { style: 'fire', species: 'dragon' },
  { style: 'sleepy', species: 'fish' },
  { style: 'mystery', species: null },
]
const ALL_SPECIES: PetSpeciesId[] = ['dragon', 'fish']

export function WelcomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // /welcome?step=egg opens the egg screen directly (from the pet tab when no pet hatched yet).
  const [step, setStep] = useState(params.get('step') === 'egg' ? STEPS - 1 : 0)

  function done() {
    finishOnboarding()
    void navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-4 pb-6">
      <div className="flex h-11 items-center justify-between">
        <div className="flex gap-1.5" aria-label={t('welcome.progress', { step: step + 1, total: STEPS })} role="img">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30')} />
          ))}
        </div>
        {step < STEPS - 1 ? (
          <Button variant="ghost" size="sm" onClick={() => setStep(STEPS - 1)}>
            {t('welcome.skip')}
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={done}>
            {t('welcome.later')}
          </Button>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center gap-6">
        {step === 0 && <Intro onNext={() => setStep(1)} />}
        {step === 1 && <Practice onNext={() => setStep(2)} />}
        {step === 2 && <ThemeStep onNext={() => setStep(3)} />}
        {step === 3 && <Hatch onDone={done} />}
      </div>
    </div>
  )
}

function Intro({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex items-end justify-center gap-2">
        <Pet species="dragon" size={150} />
        <Pet species="fish" size={120} />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-medium">{t('welcome.introTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('welcome.introText')}</p>
      </div>
      <Button size="lg" onClick={onNext}>
        {t('welcome.start')}
      </Button>
    </>
  )
}

/** Learning by doing: swipe one demo invite. */
function Practice({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const [answer, setAnswer] = useState<SwipeDir | null>(null)
  const actions: SwipeAction[] = [
    { dir: 'left', label: t('meetup.notGoing'), icon: X, tone: 'border-muted-foreground/40 text-muted-foreground' },
    { dir: 'up', label: t('meetup.maybe'), icon: HelpCircle, tone: 'border-amber-500 text-amber-600 dark:text-amber-400' },
    { dir: 'right', label: t('meetup.going'), icon: Check, tone: 'border-primary text-primary' },
  ]
  const result = { right: t('meetup.going'), left: t('meetup.notGoing'), up: t('meetup.maybe') }
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-medium">{t('welcome.practiceTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('welcome.practiceText')}</p>
      </div>
      {answer === null ? (
        <SwipeDeck
          items={['demo']}
          getKey={(k) => k}
          label={t('welcome.practiceTitle')}
          actions={actions}
          onSwipe={(_, dir) => setAnswer(dir)}
          renderCard={() => (
            <div className="p-5 pt-14">
              <p className="text-xs text-muted-foreground">{t('welcome.demoGang')}</p>
              <h3 className="text-xl font-medium">{t('welcome.demoTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('welcome.demoWhen')}</p>
            </div>
          )}
        />
      ) : (
        <>
          <p className="text-center text-lg" role="status">
            {t('welcome.practiceDone', { answer: result[answer] })}
          </p>
          <Button size="lg" onClick={onNext}>
            {t('welcome.next')}
          </Button>
        </>
      )}
    </>
  )
}

function ThemeStep({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [mode, setModeState] = useState<Mode>(getMode)
  const options: { value: Theme; label: string }[] = [
    { value: 'default', label: t('pages.me.themeDefault') },
    { value: 'cute', label: t('pages.me.themeCute') },
  ]
  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-medium">{t('welcome.themeTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('welcome.themeText')}</p>
      </div>
      {/* Show, don't tell: each tile is a tiny screen painted in its own theme. */}
      <div className="grid grid-cols-2 gap-3" role="group" aria-label={t('pages.me.chooseTheme')}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={theme === option.value}
            onClick={() => {
              setTheme(option.value)
              setThemeState(option.value)
            }}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-2 transition-transform active:scale-95',
              theme === option.value ? 'border-primary' : 'border-transparent',
            )}
          >
            <ThemePreview theme={option.value} />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>
      <ModeChoice
        value={mode}
        onChange={(next) => {
          setMode(next)
          setModeState(next)
        }}
      />
      <Button size="lg" onClick={onNext}>
        {t('welcome.next')}
      </Button>
    </>
  )
}

/** A mini mock screen that uses the theme's own CSS variables. */
function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div
      data-theme={theme}
      data-mode={document.documentElement.dataset.mode}
      className="flex aspect-[3/4] w-full flex-col gap-1.5 rounded-xl border bg-background p-2"
      aria-hidden="true"
    >
      <div className="h-2 w-1/2 rounded-full bg-foreground/70" />
      <div className="flex flex-1 flex-col justify-between rounded-lg bg-card p-1.5 shadow-sm ring-1 ring-border">
        <div className="space-y-1">
          <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/50" />
          <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex justify-center gap-1.5">
          <span className="size-4 rounded-full border-2 border-muted-foreground/40" />
          <span className="size-4 rounded-full bg-primary" />
        </div>
      </div>
      <div className="flex justify-around">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('size-2 rounded-full', i === 0 ? 'bg-primary' : 'bg-muted-foreground/30')} />
        ))}
      </div>
    </div>
  )
}

/** Choose 1 of 3 eggs → wobble → crack → meet your pet (DECISIONS #47). */
function Hatch({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  // The main pet is permanent: replaying the intro shows it again instead of a new egg.
  const [existing] = useState(() => getMyPet()?.species ?? null)
  const [picked, setPicked] = useState<number | null>(null)
  const [phase, setPhase] = useState<'choose' | 'wobble' | 'crack' | 'born'>(existing ? 'born' : 'choose')
  const [species, setSpecies] = useState<PetSpeciesId | null>(existing)

  function pick(index: number) {
    if (phase !== 'choose') return
    const egg = EGGS[index]
    const result = egg.species ?? ALL_SPECIES[secureRandomInt(ALL_SPECIES.length)]
    setPicked(index)
    setSpecies(result)
    saveMyPet(result)
    setPhase('wobble')
    window.setTimeout(() => setPhase('crack'), 1500)
    window.setTimeout(() => setPhase('born'), 1850)
  }

  if (phase === 'born' && species) {
    return (
      <>
        <div className="pet-hatch flex justify-center">
          <Pet species={species} size={240} />
        </div>
        <div className="text-center" role="status">
          <h1 className="text-2xl font-medium">{t(existing ? 'welcome.yourPet' : 'welcome.bornTitle', { name: t(`pet.species.${species}`) })}</h1>
          <p className="mt-2 text-muted-foreground">{t(`welcome.bornText.${species}`)}</p>
        </div>
        <Button size="lg" onClick={onDone}>
          {t('welcome.finish')}
        </Button>
      </>
    )
  }

  return (
    <>
      <div className="text-center">
        <h1 className="text-2xl font-medium">{t('welcome.eggTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('welcome.eggText')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {EGGS.map((egg, i) => (
          <button
            key={egg.style}
            type="button"
            onClick={() => pick(i)}
            disabled={phase !== 'choose' && picked !== i}
            className={cn('flex flex-col items-center gap-2 rounded-2xl p-2 transition-opacity active:scale-95', picked !== null && picked !== i && 'opacity-30')}
          >
            <Egg style={egg.style} state={picked === i ? (phase === 'crack' ? 'crack' : phase === 'wobble' ? 'wobble' : 'idle') : 'idle'} className="h-28" />
            <span className="text-sm font-medium">{t(`welcome.eggs.${egg.style}`)}</span>
          </button>
        ))}
      </div>
    </>
  )
}

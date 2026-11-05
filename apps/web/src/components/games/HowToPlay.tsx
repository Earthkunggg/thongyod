import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, CircleHelp, Play, Target } from 'lucide-react'
import { SoundToggle } from '@/components/common/SoundToggle'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { gameById, type GameId } from '@/config/games'
import { HOW_TO } from '@/config/howTo'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import './games.css'

type SheetProps = { game: GameId; open: boolean; onOpenChange: (open: boolean) => void }

// "วิธีเล่น" tutorial: the goal, then one big illustrated step at a time (back / next), last step = start playing.
export function HowToPlaySheet({ game, open, onOpenChange }: SheetProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const icons = HOW_TO[game]
  const tint = gameById(game).tint
  const total = icons.length
  const Icon = icons[step]
  const key = `games.howto.${game}.s${step + 1}` as 'games.howto.spy.s1'

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setStep(0)
      }}
      title={t('games.howto.title', { game: t(`games.list.${game}.title`) })}
    >
      <div className="flex flex-col gap-4 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <p className="flex items-start gap-2 rounded-2xl bg-muted p-3 text-sm">
          <Target className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <b className="font-medium">{t('games.howto.goalLabel')}: </b>
            {t(`games.howto.${game}.goal`)}
          </span>
        </p>
        <div key={step} className="game-card-in flex flex-col items-center gap-3 py-2 text-center" aria-live="polite">
          <span className={cn('grid size-24 place-items-center rounded-full', tintClass(tint))}>
            <Icon className="game-breathe size-12" aria-hidden="true" />
          </span>
          <span className="text-xs text-muted-foreground">{t('games.howto.stepOf', { n: step + 1, total })}</span>
          <span className="text-2xl font-medium">{t(`${key}.title`)}</span>
          <span className="max-w-xs text-base text-muted-foreground">{t(`${key}.text`)}</span>
        </div>
        <div className="flex justify-center gap-1.5" aria-hidden="true">
          {icons.map((_, i) => (
            <span key={i} className={cn('h-2 rounded-full transition-all', i === step ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30')} />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" disabled={step === 0} onClick={() => setStep((s) => s - 1)} aria-label={t('games.previous')}>
            <ChevronLeft />
          </Button>
          {step < total - 1 ? (
            <Button size="lg" className="flex-1" onClick={() => setStep((s) => s + 1)}>
              {t('games.next')}
              <ChevronRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                onOpenChange(false)
                setStep(0)
              }}
            >
              <Play data-icon="inline-start" />
              {t('games.howto.gotIt')}
            </Button>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}

/** "?" button that opens the tutorial. */
export function HowToButton({ game }: { game: GameId }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon" aria-label={t('games.howto.button')} onClick={() => setOpen(true)}>
        <CircleHelp />
      </Button>
      <HowToPlaySheet game={game} open={open} onOpenChange={setOpen} />
    </>
  )
}

/** Right side of every game's PageHeader: วิธีเล่น + sound. */
export function GameHeaderActions({ game, sound = true }: { game: GameId; sound?: boolean }) {
  return (
    <span className="flex items-center">
      <HowToButton game={game} />
      {sound && <SoundToggle game={game} />}
    </span>
  )
}

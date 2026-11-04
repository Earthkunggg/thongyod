import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, UserPlus, Vibrate } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { FortuneCard } from '@/features/fortune/FortuneCard'
import { FortuneCup } from '@/features/fortune/FortuneCup'
import { bangkokDayKey, drawForToday, levelOf, type Draw } from '@/features/fortune/logic'
import { loadDraw, saveDraw } from '@/features/fortune/storage'
import { useShake } from '@/features/fortune/useShake'
import { celebrate } from '@/lib/celebrate'
import { appUrl, lineShareUrl } from '@/lib/share'
import { cn } from '@/lib/utils'

type Phase = 'ready' | 'shaking' | 'stick' | 'card'
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

// เซียมซี (DECISIONS #51): shake (or tap) → the cup shakes → a stick pops out → the fortune card.
export function FortunePage() {
  const { t } = useTranslation()
  const [draw, setDraw] = useState<Draw | null>(() => {
    const saved = loadDraw()
    return saved && saved.day === bangkokDayKey(new Date()) ? saved : null
  })
  const [phase, setPhase] = useState<Phase>(draw ? 'card' : 'ready')
  const [alreadyToday] = useState(draw !== null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(window.clearTimeout), [])

  function reveal(next: Draw) {
    setPhase('card')
    if (levelOf(next.stick) === 'great') celebrate()
  }

  function shake() {
    if (phase === 'shaking' || phase === 'stick') {
      // Tap during the animation = skip to the card.
      timers.current.forEach(window.clearTimeout)
      if (draw) reveal(draw)
      return
    }
    if (phase !== 'ready') return
    const { draw: next } = drawForToday(new Date(), loadDraw())
    saveDraw(next)
    setDraw(next)
    navigator.vibrate?.([40, 60, 40])
    if (reducedMotion()) {
      reveal(next)
      return
    }
    setPhase('shaking')
    timers.current = [window.setTimeout(() => setPhase('stick'), 700), window.setTimeout(() => reveal(next), 1150)]
  }

  const { support, requestPermission } = useShake(shake, phase === 'ready')

  const shareText = draw
    ? t('fortune.shareText', {
        n: draw.stick,
        level: t(`fortune.levels.${levelOf(draw.stick)}`),
        poem1: t(`fortune.sticks.s${draw.stick}.poem1` as 'fortune.sticks.s1.poem1'),
        poem2: t(`fortune.sticks.s${draw.stick}.poem2` as 'fortune.sticks.s1.poem2'),
        study: t(`fortune.sticks.s${draw.stick}.study` as 'fortune.sticks.s1.study'),
        money: t(`fortune.sticks.s${draw.stick}.money` as 'fortune.sticks.s1.money'),
        love: t(`fortune.sticks.s${draw.stick}.love` as 'fortune.sticks.s1.love'),
      })
    : ''

  return (
    <>
      <PageHeader title={t('fortune.title')} subtitle={t('fortune.subtitle')} backTo="/explore" />

      <div className="flex flex-col items-center gap-5 px-4 pb-8">
        {phase !== 'card' ? (
          <>
            <button type="button" onClick={shake} aria-label={t('fortune.cylinder')} className="mt-4 touch-manipulation">
              <FortuneCup state={phase === 'shaking' ? 'shaking' : phase === 'stick' ? 'out' : 'idle'} stick={draw?.stick} className="h-72" />
            </button>
            <Button size="lg" className="w-full" onClick={shake}>
              <Vibrate data-icon="inline-start" />
              {t('fortune.shake')}
            </Button>
            <p className="text-center text-sm text-muted-foreground">{t('fortune.hint')}</p>
            {support === 'needs-permission' && (
              <Button variant="outline" onClick={() => void requestPermission()}>
                {t('fortune.enableShake')}
              </Button>
            )}
            {support === 'denied' && <p className="text-center text-xs text-muted-foreground">{t('fortune.shakeOff')}</p>}
          </>
        ) : (
          draw && (
            <>
              <FortuneCup state="out" stick={draw.stick} className="h-44" />
              {alreadyToday && <p className="-mt-2 text-sm font-medium">{t('fortune.todayTitle')}</p>}
              <div className="w-full">
                <FortuneCard stick={draw.stick} />
              </div>
              <p className="text-sm text-muted-foreground">{t('fortune.comeBack')}</p>
              <a href={lineShareUrl(shareText)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
                <Share2 data-icon="inline-start" />
                {t('fortune.share')}
              </a>
              <a
                href={lineShareUrl(`${t('fortune.inviteText')}\n${appUrl('/fortune')}`)}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
              >
                <UserPlus data-icon="inline-start" />
                {t('fortune.invite')}
              </a>
            </>
          )
        )}
      </div>
    </>
  )
}

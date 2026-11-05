import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Hand, Play, Pointer, Settings2, Shuffle } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { BottomAction } from '@/components/games/BottomAction'
import { GameCard } from '@/components/games/GameCard'
import { PackPicker } from '@/components/games/PackPicker'
import { Button } from '@/components/ui/button'
import type { PartyPack } from '@/config/games/party'
import { markDone } from '@/features/daily/daily'
import { gameDeck } from '@/lib/deck'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { cardsOf, validPacks, type PartyCard } from './logic'
import '@/components/games/games.css'

type Game = 'mostLikely' | 'neverHave'

type Props = { game: Game; packs: readonly PartyPack[] }

const PACKS_KEY = (game: Game) => `thongyod-party-${game}`

function loadPacks(game: Game, packs: readonly PartyPack[]): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PACKS_KEY(game)) ?? '[]')
    return validPacks(packs, Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [])
  } catch {
    return [packs[0].id]
  }
}

// One-phone party deck: pick packs → deal cards. ใครน่าจะ… adds a 3-2-1 "ชี้!" countdown.
export function PartyDeckGame({ game, packs }: Props) {
  const { t } = useTranslation()
  const sound = useGameSound(game)
  const deck = useRef(gameDeck(game))
  const [chosen, setChosen] = useState<string[]>(() => loadPacks(game, packs))
  const [cards, setCards] = useState<PartyCard[] | null>(null)
  const [index, setIndex] = useState(0)
  const [wentBack, setWentBack] = useState(false)
  const [count, setCount] = useState<number | null>(null)
  const timers = useRef<number[]>([])

  function choose(ids: string[]) {
    setChosen(ids)
    try {
      localStorage.setItem(PACKS_KEY(game), JSON.stringify(ids))
    } catch {
      // Not remembered; fine.
    }
  }

  function start() {
    unlockSound()
    const order = deck.current.order(cardsOf(packs, chosen), (c) => c.text)
    setCards(order)
    setIndex(0)
    setWentBack(false)
    deck.current.markSeen([order[0].text])
    markDone('tool')
    if (sound) playSound('flip')
  }

  function go(step: 1 | -1) {
    if (!cards) return
    stopCount()
    let next = index + step
    if (next < 0) return
    if (next >= cards.length) {
      // Whole deck played: deal again in a new order.
      const order = deck.current.order(cardsOf(packs, chosen), (c) => c.text)
      setCards(order)
      next = 0
    }
    setIndex(next)
    setWentBack(step < 0)
    if (step > 0 && cards[next]) deck.current.markSeen([cards[next].text])
    if (sound) playSound('flip', 0.7)
  }

  function stopCount() {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
    setCount(null)
  }

  /** 3 · 2 · 1 · ชี้! — everyone points at the same moment. */
  function countdown() {
    stopCount()
    unlockSound()
    ;[3, 2, 1, 0].forEach((n, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setCount(n)
          if (sound) playSound(n === 0 ? 'go' : 'countdown')
          if (n === 0) buzz(60)
        }, i * 800),
      )
    })
    timers.current.push(window.setTimeout(() => setCount(null), 4 * 800 + 1400))
  }

  if (!cards) {
    const how =
      game === 'mostLikely'
        ? (['read', 'count', 'point'] as const).map((s) => t(`games.party.mostLikely.how.${s}`))
        : (['hands', 'fold', 'out'] as const).map((s) => t(`games.party.neverHave.how.${s}`))
    return (
      <div className="flex flex-col gap-3 pb-28">
        <ol className="mx-3 grid gap-2 rounded-2xl border bg-card p-4 text-sm">
          {how.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-medium text-primary-foreground">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <SectionHeader title={t('games.party.packsTitle')} />
        <PackPicker
          multiple
          label={t('games.party.packsTitle')}
          value={chosen}
          onChange={choose}
          packs={packs.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`games.party.packs.${p.id}`), meta: t('games.cardsCount', { count: p.cards.length }) }))}
        />
        <BottomAction>
          <Button size="lg" className="flex-1" onClick={start}>
            <Play data-icon="inline-start" />
            {t('games.start')}
          </Button>
        </BottomAction>
      </div>
    )
  }

  const card = cards[index]
  const pack = packs.find((p) => p.id === card.pack) ?? packs[0]
  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('games.cardOf', { n: index + 1, total: cards.length })}</span>
        <Button variant="ghost" size="sm" onClick={() => setCards(null)}>
          <Settings2 data-icon="inline-start" />
          {t('games.party.changePacks')}
        </Button>
      </div>

      <div className="relative">
        <GameCard
          cardKey={`${index}-${card.text}`}
          back={wentBack}
          tint={pack.tint}
          eyebrow={t(`games.party.${game}.lead`)}
          text={game === 'mostLikely' ? `${card.text}?` : card.text}
          onTap={() => go(1)}
          tapLabel={t('games.next')}
        >
          <span className="text-xs opacity-70">{t(`games.party.packs.${card.pack}`)}</span>
        </GameCard>
        {count !== null && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-3xl bg-background/70 backdrop-blur-sm" aria-live="assertive">
            <span key={count} className={count === 0 ? 'game-pop text-6xl font-medium text-primary' : 'game-count text-8xl font-medium tabular-nums'}>
              {count === 0 ? t('games.party.mostLikely.point') : count}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="lg" disabled={index === 0} onClick={() => go(-1)} aria-label={t('games.previous')}>
          <ChevronLeft />
        </Button>
        {game === 'mostLikely' ? (
          <Button variant="secondary" size="lg" className="flex-1" onClick={countdown}>
            <Pointer data-icon="inline-start" />
            {t('games.party.mostLikely.countdown')}
          </Button>
        ) : (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-3 text-xs text-muted-foreground">
            <Hand className="size-4" aria-hidden="true" />
            {t('games.party.neverHave.reminder')}
          </div>
        )}
        <Button size="lg" onClick={() => go(1)}>
          {t('games.next')}
          <ChevronRight data-icon="inline-end" />
        </Button>
      </div>
      <Button variant="ghost" onClick={start}>
        <Shuffle data-icon="inline-start" />
        {t('games.reshuffle')}
      </Button>
    </div>
  )
}

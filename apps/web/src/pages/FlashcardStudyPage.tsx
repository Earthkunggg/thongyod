import { useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Check, PartyPopper, RotateCw, Undo2, X } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { SwipeDeck, type SwipeAction } from '@/components/common/SwipeDeck'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { markDone } from '@/features/daily/daily'
import { applyRound, studyOrder, type Card } from '@/features/flashcards/logic'
import { getDeck, saveDeck, useDecks } from '@/features/flashcards/storage'
import { celebrate } from '@/lib/celebrate'
import { TONE_CLASS } from '@/lib/tones'
import { FitText } from '@/components/common/FitText'
import { FlipCard } from '@/components/games/FlipCard'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

// /flashcards/:deckId/study[?only=unknown][&shuffle=1] — swipe right = รู้แล้ว, left = ยังไม่รู้, tap = flip.
// The result of the round is saved on the deck (which cards I know).
export function FlashcardStudyPage() {
  const { t } = useTranslation()
  const { deckId = '' } = useParams()
  const [params] = useSearchParams()
  const deck = useDecks().find((d) => d.id === deckId)
  const [round, setRound] = useState(0)
  const [onlyUnknown, setOnlyUnknown] = useState(params.get('only') === 'unknown')
  const shuffled = params.get('shuffle') === '1'

  // The order is fixed for a round (editing the deck mid-round does not reshuffle).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const order = useMemo(() => (deck ? studyOrder(deck, onlyUnknown, shuffled) : []), [deckId, round])

  if (!deck) {
    return (
      <>
        <PageHeader title={t('flashcards.title')} backTo="/flashcards" />
        <EmptyState title={t('flashcards.notFound')} />
      </>
    )
  }
  return (
    <Round
      key={round}
      deckId={deck.id}
      title={deck.title}
      cards={order}
      onAgain={(unknownOnly) => {
        setOnlyUnknown(unknownOnly)
        setRound((r) => r + 1)
      }}
    />
  )
}

function Round({ deckId, title, cards, onAgain }: { deckId: string; title: string; cards: Card[]; onAgain: (onlyUnknown: boolean) => void }) {
  const { t } = useTranslation()
  const [left, setLeft] = useState(cards)
  const [flipped, setFlipped] = useState<string | null>(null)
  const [known, setKnown] = useState<string[]>([])
  const [unknown, setUnknown] = useState<string[]>([])
  const history = useRef<Array<{ card: Card; known: boolean }>>([])
  const saved = useRef(false)

  const actions: SwipeAction[] = [
    { dir: 'left', label: t('flashcards.unknown'), icon: X, tone: 'border-muted-foreground/40 text-muted-foreground' },
    { dir: 'right', label: t('flashcards.known'), icon: Check, tone: 'border-primary text-primary' },
  ]

  function answer(card: Card, isKnown: boolean) {
    history.current.push({ card, known: isKnown })
    const nextKnown = isKnown ? [...known, card.id] : known
    const nextUnknown = isKnown ? unknown : [...unknown, card.id]
    setKnown(nextKnown)
    setUnknown(nextUnknown)
    setFlipped(null)
    const rest = left.filter((c) => c.id !== card.id)
    setLeft(rest)
    if (rest.length === 0 && !saved.current) {
      saved.current = true
      const current = getDeck(deckId)
      if (current) saveDeck(applyRound(current, nextKnown, nextUnknown, new Date()))
      markDone('tool')
      if (nextUnknown.length === 0 && nextKnown.length > 0) celebrate()
    }
  }

  function undo() {
    const last = history.current.pop()
    if (!last || saved.current) return
    setLeft((l) => [last.card, ...l])
    setKnown((k) => k.filter((id) => id !== last.card.id))
    setUnknown((u) => u.filter((id) => id !== last.card.id))
  }

  const done = cards.length - left.length

  if (cards.length === 0) {
    return (
      <>
        <PageHeader title={title} backTo={`/flashcards/${deckId}`} />
        <EmptyState title={t('flashcards.nothingToStudy')} />
      </>
    )
  }

  if (left.length === 0) {
    const perfect = unknown.length === 0
    return (
      <>
        <PageHeader title={title} backTo={`/flashcards/${deckId}`} />
        <div className="flex flex-col items-center gap-3 px-4 pt-6 text-center">
          <span className={cn('flex size-20 items-center justify-center rounded-full', TONE_CLASS[perfect ? 'success' : 'accent'])} aria-hidden="true">
            <PartyPopper className="size-10" />
          </span>
          <h2 className="text-2xl font-medium">{t('flashcards.doneTitle')}</h2>
          <p className="text-sm text-muted-foreground">{perfect ? t('flashcards.doneAll') : t('flashcards.doneScore', { known: known.length, unknown: unknown.length })}</p>
          {/* Two bars instead of numbers only (show, don't tell). */}
          <div className="flex h-3 w-full max-w-xs overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className="bg-tone-success-foreground" style={{ width: `${(known.length / cards.length) * 100}%` }} />
          </div>
          <div className="mt-2 flex w-full flex-col gap-2">
            {!perfect && (
              <Button size="lg" onClick={() => onAgain(true)}>
                {t('flashcards.studyUnknown', { count: unknown.length })}
              </Button>
            )}
            <Button size="lg" variant={perfect ? 'default' : 'outline'} onClick={() => onAgain(false)}>
              <RotateCw data-icon="inline-start" />
              {t('flashcards.again')}
            </Button>
            <Link to={`/flashcards/${deckId}`} className={buttonVariants({ variant: 'ghost' })}>
              {t('flashcards.backToDeck')}
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={t('flashcards.progress', { done: done + 1, total: cards.length })}
        backTo={`/flashcards/${deckId}`}
        action={
          <Button variant="ghost" size="icon" aria-label={t('common.undo')} disabled={done === 0} onClick={undo}>
            <Undo2 />
          </Button>
        }
      />
      {/* Progress bar under the header. */}
      <div className="mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(done / cards.length) * 100}%` }} />
      </div>
      <SwipeDeck<Card>
        items={left}
        getKey={(c) => c.id}
        label={t('flashcards.deckLabel')}
        actions={actions}
        tall
        onSwipe={(card, dir) => answer(card, dir === 'right')}
        onOpen={(card) => setFlipped((f) => (f === card.id ? null : card.id))}
        bare
        renderCard={(card) => {
          const showBack = flipped === card.id
          const face = 'flex size-full flex-col items-center justify-center gap-3 rounded-2xl border p-6 text-center shadow-sm'
          return (
            <FlipCard
              flipped={showBack}
              className="h-[58dvh] w-full"
              front={
                <div className={cn(face, 'bg-card')}>
                  <span className="text-xs text-muted-foreground">{t('flashcards.front')}</span>
                  <FitText text={card.front} max={44} min={20} maxLines={6} className="min-h-0 w-full flex-1 font-heading font-medium" />
                  <span className="text-xs text-muted-foreground">{t('flashcards.tapToFlip')}</span>
                </div>
              }
              back={
                <div className={cn(face, tintClass(5))}>
                  <span className="text-xs opacity-80">{t('flashcards.back')}</span>
                  <FitText text={card.back} max={36} min={18} maxLines={8} className="min-h-0 w-full flex-1 font-heading" />
                </div>
              }
            />
          )
        }}
      />
      <p className="pt-2 text-center text-xs text-muted-foreground">{t('flashcards.subtitle')}</p>
    </>
  )
}

import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Layers, Plus, Sparkles } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { ListRow } from '@/components/common/ListRow'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SAMPLE_DECK } from '@/config/flashcardSamples'
import { knownPercent, makeCard, type Card as FlashCard, type Deck } from '@/features/flashcards/logic'
import { newId, saveDeck, useDecks } from '@/features/flashcards/storage'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

// /flashcards — my decks on this device. Make one, or try the sample deck.
export function FlashcardsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const decks = useDecks()

  function create(title: string, pairs: ReadonlyArray<readonly [string, string]> = []) {
    const deck: Deck = {
      id: newId(),
      title,
      cards: pairs.map(([f, b]) => makeCard(newId(), f, b)).filter((c): c is FlashCard => c !== null),
      known: [],
      createdAt: new Date().toISOString(),
      studiedAt: null,
    }
    saveDeck(deck)
    return deck.id
  }

  return (
    <div className="flex flex-col gap-3 pb-28">
      <PageHeader title={t('flashcards.title')} subtitle={t('flashcards.onDevice')} backTo="/explore" />
      {decks.length === 0 ? (
        <Card className="mx-3">
          <EmptyState
            title={t('flashcards.empty')}
            hint={t('flashcards.emptyHint')}
            action={
              <Button variant="outline" onClick={() => void navigate(`/flashcards/${create(SAMPLE_DECK.title, SAMPLE_DECK.cards)}`)}>
                <Sparkles data-icon="inline-start" />
                {t('flashcards.trySample')}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card className="mx-3 px-4 py-1">
          {decks.map((deck, i) => (
            <ListRow
              key={deck.id}
              leading={
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tintClass(i + 5))} aria-hidden="true">
                  <Layers className="size-5" />
                </span>
              }
              title={deck.title}
              subtitle={t('flashcards.deckSummary', { count: deck.cards.length, percent: knownPercent(deck) })}
              to={`/flashcards/${deck.id}`}
            />
          ))}
        </Card>
      )}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <Button size="lg" className="w-full" onClick={() => void navigate(`/flashcards/${create(t('flashcards.untitled'))}`)}>
          <Plus data-icon="inline-start" />
          {t('flashcards.newDeck')}
        </Button>
      </div>
    </div>
  )
}

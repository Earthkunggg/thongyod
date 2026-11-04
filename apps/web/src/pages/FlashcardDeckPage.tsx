import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ClipboardPaste, Play, Plus, Shuffle, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { BACK_MAX, CARDS_MAX, FRONT_MAX, TITLE_MAX, makeCard, parseBulk, type Card as FlashCard, type Deck } from '@/features/flashcards/logic'
import { deleteDeck, getDeck, newId, saveDeck, useDecks } from '@/features/flashcards/storage'
import { showUndoToast, toastManager } from '@/lib/toast'
import { cn } from '@/lib/utils'

// /flashcards/:deckId — name the deck, add cards (one by one or pasted), study.
export function FlashcardDeckPage() {
  const { t } = useTranslation()
  const { deckId = '' } = useParams()
  const deck = useDecks().find((d) => d.id === deckId)

  if (!deck) {
    return (
      <>
        <PageHeader title={t('flashcards.title')} backTo="/flashcards" />
        <EmptyState title={t('flashcards.notFound')} />
      </>
    )
  }
  return <DeckEditor deck={deck} />
}

function DeckEditor({ deck }: { deck: Deck }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulk, setBulk] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [shuffled, setShuffled] = useState(true)
  const unknown = deck.cards.filter((c) => !deck.known.includes(c.id)).length
  const full = deck.cards.length >= CARDS_MAX
  const pairs = parseBulk(bulk)

  function addCards(list: ReadonlyArray<readonly [string, string]>) {
    const room = CARDS_MAX - deck.cards.length
    const cards = list.map(([f, b]) => makeCard(newId(), f, b)).filter((c): c is FlashCard => c !== null).slice(0, room)
    if (cards.length > 0) saveDeck({ ...deck, cards: [...deck.cards, ...cards] })
    return cards.length
  }

  function onAdd(e: FormEvent) {
    e.preventDefault()
    if (addCards([[front, back]]) > 0) {
      setFront('')
      setBack('')
      document.getElementById('card-front')?.focus()
    }
  }

  function remove(card: FlashCard, index: number) {
    saveDeck({ ...deck, cards: deck.cards.filter((c) => c.id !== card.id) })
    showUndoToast({
      title: t('flashcards.cardRemoved'),
      description: card.front,
      // Undo puts the card back where it was (re-read the deck at undo time).
      onUndo: () => {
        const current = getDeck(deck.id)
        if (!current) return
        const cards = [...current.cards.filter((c) => c.id !== card.id)]
        cards.splice(Math.min(index, cards.length), 0, card)
        saveDeck({ ...current, cards })
      },
    })
  }

  return (
    <div className="flex flex-col gap-3 pb-28">
      <PageHeader
        title={deck.title || t('flashcards.untitled')}
        subtitle={t('flashcards.onDevice')}
        backTo="/flashcards"
        action={
          <Button variant="ghost" size="icon" aria-label={t('flashcards.deleteDeck')} onClick={() => setConfirmDelete(true)}>
            <Trash2 />
          </Button>
        }
      />

      <div className="px-3">
        <Input
          value={deck.title}
          maxLength={TITLE_MAX}
          onChange={(e) => saveDeck({ ...deck, title: e.target.value })}
          onBlur={() => !deck.title.trim() && saveDeck({ ...deck, title: t('flashcards.untitled') })}
          aria-label={t('flashcards.deckTitle')}
          className="text-base font-medium"
        />
      </div>

      <section>
        <SectionHeader
          title={t('flashcards.cards', { count: deck.cards.length })}
          action={
            <Button variant="ghost" size="sm" onClick={() => setBulkOpen(true)} disabled={full}>
              <ClipboardPaste data-icon="inline-start" />
              {t('flashcards.bulk')}
            </Button>
          }
        />
        <Card className="mx-3 px-4 py-1">
          {deck.cards.length === 0 ? (
            <EmptyState title={t('flashcards.noCards')} />
          ) : (
            deck.cards.map((card, i) => (
              <div key={card.id} className="flex min-h-14 items-center gap-3 py-2 [&+&]:border-t">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{card.front}</span>
                  <span className="block truncate text-xs text-muted-foreground">{card.back}</span>
                </span>
                {deck.known.includes(card.id) && <span className="size-2 shrink-0 rounded-full bg-tone-success-foreground" aria-label={t('flashcards.known')} />}
                <Button variant="ghost" size="icon-sm" aria-label={`${t('flashcards.removeCard')} ${card.front}`} onClick={() => remove(card, i)}>
                  <X />
                </Button>
              </div>
            ))
          )}
        </Card>
      </section>

      <form onSubmit={onAdd} className="mx-3 flex flex-col gap-2 rounded-xl border bg-card p-3">
        {full ? (
          <p className="text-sm text-muted-foreground">{t('flashcards.full', { max: CARDS_MAX })}</p>
        ) : (
          <>
            <Input id="card-front" value={front} maxLength={FRONT_MAX} onChange={(e) => setFront(e.target.value)} placeholder={t('flashcards.frontPlaceholder')} aria-label={t('flashcards.front')} />
            <Input value={back} maxLength={BACK_MAX} onChange={(e) => setBack(e.target.value)} placeholder={t('flashcards.backPlaceholder')} aria-label={t('flashcards.back')} />
            <Button type="submit" variant="outline" disabled={!front.trim() || !back.trim()}>
              <Plus data-icon="inline-start" />
              {t('flashcards.add')}
            </Button>
          </>
        )}
      </form>

      {/* Hero: study. */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-md flex-col gap-2 border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <div className="flex gap-2">
          <Button
            variant={shuffled ? 'secondary' : 'outline'}
            size="icon-lg"
            aria-pressed={shuffled}
            aria-label={t('flashcards.shuffle')}
            onClick={() => setShuffled((s) => !s)}
          >
            <Shuffle />
          </Button>
          <Link
            to={`/flashcards/${deck.id}/study${shuffled ? '?shuffle=1' : ''}`}
            className={cn(buttonVariants({ size: 'lg' }), 'flex-1', deck.cards.length === 0 && 'pointer-events-none opacity-50')}
            aria-disabled={deck.cards.length === 0}
          >
            <Play data-icon="inline-start" />
            {t('flashcards.study')}
          </Link>
        </div>
        {unknown > 0 && unknown < deck.cards.length && (
          <Link to={`/flashcards/${deck.id}/study?only=unknown${shuffled ? '&shuffle=1' : ''}`} className={buttonVariants({ variant: 'outline' })}>
            {t('flashcards.studyUnknown', { count: unknown })}
          </Link>
        )}
      </div>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent title={t('flashcards.bulk')} description={t('flashcards.bulkHint')}>
          <textarea
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            placeholder={t('flashcards.bulkPlaceholder')}
            rows={7}
            className="w-full rounded-lg border bg-background p-3 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
            aria-label={t('flashcards.bulk')}
          />
          {bulk.trim() !== '' && pairs.length === 0 && <p className="text-xs text-muted-foreground">{t('flashcards.bulkNone')}</p>}
          <Button
            disabled={pairs.length === 0}
            onClick={() => {
              const added = addCards(pairs)
              setBulk('')
              setBulkOpen(false)
              toastManager.add({ title: t('flashcards.added', { count: added }) })
            }}
          >
            {t('flashcards.bulkAdd', { count: pairs.length })}
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('flashcards.deleteDeckConfirm', { title: deck.title })}
        description={t('flashcards.deleteDeckHint')}
        confirmLabel={t('flashcards.deleteDeck')}
        destructive
        onConfirm={() => {
          deleteDeck(deck.id)
          void navigate('/flashcards', { replace: true })
        }}
      />
    </div>
  )
}

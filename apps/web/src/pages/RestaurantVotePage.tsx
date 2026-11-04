import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Dices, PartyPopper, Plus, RotateCw, Share2, Store, Users, X } from 'lucide-react'
import { ChipSelect } from '@/components/common/ChipSelect'
import { NumberStepper } from '@/components/common/NumberStepper'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { markDone } from '@/features/daily/daily'
import { HandoffScreen } from '@/features/quick-vote/HandoffScreen'
import { quickVoteReducer, type QuickVoteSession } from '@/features/quick-vote/logic'
import { VoteScreen } from '@/features/quick-vote/VoteScreen'
import { MAX_VOTERS, MIN_VOTERS, ROOM_MAX_OPTIONS, ROOM_MIN_OPTIONS, createRoom, roomOutcome, type RoomOutcome } from '@/features/restaurant-vote/logic'
import { NAME_MAX } from '@/features/restaurants/logic'
import { useRestaurants } from '@/features/restaurants/storage'
import { celebrate } from '@/lib/celebrate'
import { secureRandomInt } from '@/lib/random'
import { appUrl, lineShareUrl } from '@/lib/share'
import { TONE_CLASS } from '@/lib/tones'
import { cn } from '@/lib/utils'

// /restaurant-vote — ห้องโหวตร้าน on one phone (spec §8.6): everyone ticks every place they are OK with,
// passing the phone (nobody sees the others' ticks). Then a fair random pick among places everyone accepted;
// if there is none, the most-voted places and what to do next. Online rooms come with the backend (phase C).
export function RestaurantVotePage() {
  const { t } = useTranslation()
  const places = useRestaurants()
  const [picked, setPicked] = useState<string[]>([])
  const [typed, setTyped] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [voters, setVoters] = useState(3)
  const [session, setSession] = useState<QuickVoteSession | null>(null)
  const [outcome, setOutcome] = useState<RoomOutcome | null>(null)

  const options = [...places.filter((p) => picked.includes(p.id)).map((p) => p.name), ...typed]
  const unique = [...new Set(options)]
  const tooMany = unique.length > ROOM_MAX_OPTIONS

  useEffect(() => {
    if (outcome?.kind === 'agreed') celebrate()
  }, [outcome])

  function addTyped(e: FormEvent) {
    e.preventDefault()
    const name = draft.trim().slice(0, NAME_MAX)
    if (name && !unique.includes(name)) setTyped((list) => [...list, name])
    setDraft('')
  }

  function start(names: string[] = unique) {
    const room = createRoom(names, voters)
    if (!room) return
    setSession({ ...room, question: t('restaurantVote.question') })
    setOutcome(null)
    markDone('tool')
  }

  function dispatch(action: Parameters<typeof quickVoteReducer>[1]) {
    if (!session) return
    const next = quickVoteReducer(session, action)
    setSession(next)
    // The engine ends voting as "result"/"decided"; the room uses its own rule (§8.6).
    if (next.phase === 'result' || next.phase === 'decided') setOutcome(roomOutcome(next))
  }

  if (session && !outcome) {
    return (
      <>
        <PageHeader title={t('restaurantVote.title')} backTo="/explore" />
        {session.phase === 'handoff' ? (
          <HandoffScreen session={session} onNext={() => dispatch({ type: 'next' })} onUndo={() => dispatch({ type: 'undo' })} onCloseNow={() => dispatch({ type: 'closeEarly' })} />
        ) : (
          <VoteScreen key={session.ballots.length} session={session} onVote={(choices) => dispatch({ type: 'vote', choices })} />
        )}
      </>
    )
  }

  if (session && outcome) {
    const name = (i: number) => session.options[i]
    return (
      <>
        <PageHeader title={t('restaurantVote.title')} backTo="/explore" />
        <div className="flex flex-col gap-3 px-4 pb-8">
          {outcome.kind === 'agreed' ? (
            <div className="flex flex-col items-center gap-2 pt-4 text-center">
              <span className={cn('flex size-20 items-center justify-center rounded-full', TONE_CLASS.success)} aria-hidden="true">
                <PartyPopper className="size-10" />
              </span>
              <p className="text-sm text-muted-foreground">{t('restaurantVote.agreed', { count: outcome.pool.length })}</p>
              <p className="font-heading text-3xl font-medium">{name(outcome.winner)}</p>
              {outcome.pool.length > 1 && <p className="text-xs text-muted-foreground">{t('restaurantVote.pool', { names: outcome.pool.map(name).join(', ') })}</p>}
              <a
                href={lineShareUrl(`${t('restaurantVote.shareText', { name: name(outcome.winner) })}\n${appUrl('/restaurant-vote')}`)}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: 'lg' }), 'mt-2 w-full')}
              >
                <Share2 data-icon="inline-start" />
                {t('restaurantVote.share')}
              </a>
            </div>
          ) : (
            <Card className="flex flex-col gap-2 p-4">
              <p className="font-medium">{t('restaurantVote.noCommon')}</p>
              <p className="text-sm text-muted-foreground">{outcome.top.length > 0 ? t('restaurantVote.topVoted', { votes: outcome.votes }) : t('restaurantVote.nobody')}</p>
              <ul className="flex flex-col gap-1">
                {outcome.top.map((i) => (
                  <li key={i} className="rounded-lg bg-muted px-3 py-2 text-sm font-medium">
                    {name(i)}
                  </li>
                ))}
              </ul>
              {outcome.top.length > 1 && (
                <Button onClick={() => setOutcome({ kind: 'agreed', winner: outcome.top[secureRandomInt(outcome.top.length)], pool: outcome.top })}>
                  <Dices data-icon="inline-start" />
                  {t('restaurantVote.randomTop')}
                </Button>
              )}
              {outcome.top.length > 0 && (
                <Button variant="outline" onClick={() => start(outcome.top.map(name))}>
                  <RotateCw data-icon="inline-start" />
                  {t('restaurantVote.revote')}
                </Button>
              )}
            </Card>
          )}
          <Button
            variant="ghost"
            onClick={() => {
              setSession(null)
              setOutcome(null)
            }}
          >
            {t('restaurantVote.newRoom')}
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3 pb-28">
      <PageHeader title={t('restaurantVote.title')} subtitle={t('restaurantVote.subtitle')} backTo="/explore" />

      <section>
        <SectionHeader
          title={t('restaurantVote.fromMine')}
          action={
            <Link to="/restaurants" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <Store data-icon="inline-start" />
              {t('restaurants.mine')}
            </Link>
          }
        />
        <div className="px-3">
          {places.length > 0 ? (
            <ChipSelect<string> label={t('restaurantVote.fromMine')} value={picked} onChange={setPicked} options={places.map((p) => ({ value: p.id, label: p.name }))} />
          ) : (
            <p className="text-sm text-muted-foreground">{t('restaurantVote.noPins')}</p>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title={t('restaurantVote.typeIn')} />
        <form onSubmit={addTyped} className="flex gap-2 px-3">
          <Input value={draft} maxLength={NAME_MAX} onChange={(e) => setDraft(e.target.value)} placeholder={t('restaurants.namePlaceholder')} aria-label={t('restaurantVote.typeIn')} />
          <Button type="submit" size="icon" variant="outline" aria-label={t('restaurantVote.add')} disabled={!draft.trim()}>
            <Plus />
          </Button>
        </form>
        {typed.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2">
            {typed.map((n) => (
              <span key={n} className="flex min-h-9 items-center gap-1 rounded-full border bg-card pr-1 pl-3 text-sm">
                {n}
                <Button variant="ghost" size="icon-xs" aria-label={`${t('restaurantVote.remove')} ${n}`} onClick={() => setTyped((list) => list.filter((x) => x !== n))}>
                  <X />
                </Button>
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title={t('restaurantVote.voters')} />
        <div className="flex items-center gap-3 px-3">
          <Users className="size-5 text-muted-foreground" aria-hidden="true" />
          <NumberStepper value={voters} onChange={setVoters} min={MIN_VOTERS} max={MAX_VOTERS} label={t('restaurantVote.voters')} />
        </div>
      </section>

      <p className={cn('px-4 text-xs', tooMany ? 'text-destructive' : 'text-muted-foreground')}>
        {t('restaurantVote.count', { count: unique.length, min: ROOM_MIN_OPTIONS, max: ROOM_MAX_OPTIONS })}
      </p>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <Button size="lg" className="w-full" disabled={unique.length < ROOM_MIN_OPTIONS || tooMany} onClick={() => start()}>
          {t('restaurantVote.start')}
        </Button>
      </div>
    </div>
  )
}

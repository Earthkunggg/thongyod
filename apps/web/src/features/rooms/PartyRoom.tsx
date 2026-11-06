import { useTranslation } from 'react-i18next'
import { Check, ChevronRight, Crown, Eye, Hand, Trophy } from 'lucide-react'
import { useBackToLobby, useRevealRound, useRoomSettings, useRoomVote, useStartRound } from '@/api/rooms'
import type { PartyRoomData } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { GameCard } from '@/components/games/GameCard'
import { PackPicker } from '@/components/games/PackPicker'
import { Button } from '@/components/ui/button'
import { MOST_LIKELY, NEVER_HAVE, type PartyPackId } from '@/config/games/party'
import { START_FINGERS, topVoted } from '@/features/party/roomLogic'
import { celebrate } from '@/lib/celebrate'
import { buzz, playSound, unlockSound } from '@/lib/sound'
import { useGameSound } from '@/lib/soundPrefs'
import { showErrorToast } from '@/lib/toast'
import { TONE_CLASS, tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { PlayerList, RoomLobby } from './RoomParts'
import '@/components/games/games.css'

type Props = { room: PartyRoomData; meId: string; onLeave: () => void }

// ใครน่าจะ… / ไม่เคย… with each friend on their own phone: everyone answers the same card on their phone,
// the result shows when all have answered (or the host opens it). ใครน่าจะ… votes are anonymous.
export function PartyRoom({ room, meId, onLeave }: Props) {
  const { t } = useTranslation()
  const game = room.game
  const sound = useGameSound(game)
  const packs = game === 'mostLikely' ? MOST_LIKELY : NEVER_HAVE
  const isHost = room.hostId === meId
  const start = useStartRound(room.code)
  const reveal = useRevealRound(room.code)
  const lobby = useBackToLobby(room.code)
  const settings = useRoomSettings(room.code)
  const vote = useRoomVote(room.code)
  const onError = () => showErrorToast(t('common.saveError'))
  const name = (id: string) => room.players.find((p) => p.userId === id)?.displayName ?? '?'
  const minPlayers = game === 'mostLikely' ? 3 : 2

  function next() {
    unlockSound()
    start.mutate(undefined, { onError, onSuccess: () => sound && playSound('flip') })
  }

  if (room.state === 'lobby' || !room.round) {
    return (
      <RoomLobby room={room} isHost={isHost} minPlayers={minPlayers} starting={start.isPending} onStart={next} onLeave={onLeave}>
        <span className="text-sm font-medium">{t('games.party.packsTitle')}</span>
        <div className="-mx-3">
          <PackPicker
            multiple
            label={t('games.party.packsTitle')}
            value={room.settings.packs}
            onChange={(ids) => settings.mutate({ packs: ids }, { onError })}
            packs={packs.map((p) => ({ id: p.id, icon: p.icon, tint: p.tint, name: t(`games.party.packs.${p.id}`), meta: t('games.cardsCount', { count: p.cards.length }) }))}
          />
        </div>
      </RoomLobby>
    )
  }

  const round = room.round
  const pack = packs.find((p) => p.id === round.pack) ?? packs[0]
  const total = room.players.length
  const fingers = (id: string) => room.fingers?.[id] ?? START_FINGERS
  const fingerBadge = (id: string) =>
    game === 'neverHave' && (
      <span className={cn('flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums', fingers(id) === 0 ? TONE_CLASS.danger : TONE_CLASS.neutral)}>
        <Hand className="size-3" aria-hidden="true" />
        {fingers(id)}
      </span>
    )

  const card = (
    <GameCard
      cardKey={`${round.number}`}
      tint={pack.tint}
      eyebrow={t(`games.party.${game}.lead`)}
      text={game === 'mostLikely' ? `${round.card}?` : round.card}
      className="h-[min(34dvh,18rem)] min-h-52"
    >
      <span className="text-xs opacity-70">
        {t(`games.party.packs.${round.pack as PartyPackId}`)} · {t('rooms.round', { n: round.number })}
      </span>
    </GameCard>
  )

  if (room.state === 'playing') {
    const answered = round.votedIds.length
    const answer = (choice: string) => {
      unlockSound()
      vote.mutate(choice, { onError, onSuccess: () => sound && playSound('pop') })
      buzz(15)
    }
    return (
      <div className="flex flex-col gap-4 px-4 pb-8">
        {card}
        {game === 'mostLikely' ? (
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('rooms.party.pickWho')}>
            {room.players.map((p) => {
              const on = round.myVote === p.userId
              return (
                <button
                  key={p.userId}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => answer(p.userId)}
                  className={cn('flex flex-col items-center gap-1 rounded-2xl border p-2 transition-transform active:scale-95', on ? 'border-primary bg-primary text-primary-foreground' : 'bg-card')}
                >
                  <Avatar name={p.displayName} src={p.avatarUrl} className="size-11" />
                  <span className="w-full truncate text-center text-xs font-medium">{p.userId === meId ? t('rooms.party.me') : p.displayName}</span>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('rooms.party.haveYou')}>
            {(['have', 'never'] as const).map((choice) => {
              const on = round.myVote === choice
              return (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => answer(choice)}
                  className={cn(
                    'flex h-24 flex-col items-center justify-center gap-1 rounded-2xl border text-lg font-medium transition-transform active:scale-95',
                    on ? (choice === 'have' ? TONE_CLASS.warning : TONE_CLASS.success) + ' border-transparent ring-3 ring-primary' : 'bg-card',
                  )}
                >
                  {choice === 'have' ? <Hand className="size-7" aria-hidden="true" /> : <Check className="size-7" aria-hidden="true" />}
                  {t(`rooms.party.${choice}`)}
                </button>
              )
            })}
          </div>
        )}
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-muted p-3 text-sm">
          <span>
            {round.myVote ? t('rooms.party.waiting') : t('rooms.party.yourTurn')} · {t('rooms.party.answered', { n: answered, total })}
          </span>
          <span className="flex -space-x-2" aria-hidden="true">
            {room.players
              .filter((p) => round.votedIds.includes(p.userId))
              .map((p) => (
                <Avatar key={p.userId} name={p.displayName} src={p.avatarUrl} className="game-pop size-7 ring-2 ring-muted" />
              ))}
          </span>
        </div>
        {game === 'neverHave' && <PlayerList room={room} extra={fingerBadge} />}
        {isHost && (
          <Button variant="outline" disabled={reveal.isPending || answered === 0} onClick={() => reveal.mutate(undefined, { onError })}>
            <Eye data-icon="inline-start" />
            {t('rooms.party.showNow')}
          </Button>
        )}
      </div>
    )
  }

  // Result
  const result = round.result
  let headline = null
  if (game === 'mostLikely' && result) {
    const top = topVoted(result.tally)
    const ranked = room.players.map((p) => ({ p, votes: result.tally[p.userId] ?? 0 })).sort((a, b) => b.votes - a.votes)
    const max = Math.max(1, ...ranked.map((r) => r.votes))
    headline = (
      <>
        <div className={cn('game-pop flex flex-col items-center gap-2 rounded-3xl p-5 text-center', tintClass(pack.tint))}>
          <Crown className="size-10" aria-hidden="true" />
          <span className="text-2xl font-medium" role="status">
            {top.length ? top.map(name).join(', ') : t('rooms.party.noVotes')}
          </span>
          <span className="text-sm opacity-80">{round.card}</span>
        </div>
        <ul className="grid gap-1.5">
          {ranked.map(({ p, votes }, i) => (
            <li key={p.userId} className="flex items-center gap-2">
              <Avatar name={p.displayName} src={p.avatarUrl} className="size-8" />
              <span className="w-20 truncate text-sm">{p.displayName}</span>
              <span className="h-6 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                  style={{ width: `${(votes / max) * 100}%`, transitionDelay: `${i * 80}ms` }}
                />
              </span>
              <span className="w-6 text-right text-sm font-medium tabular-nums">{votes}</span>
            </li>
          ))}
        </ul>
        <p className="text-center text-xs text-muted-foreground">{t('rooms.party.anonymous')}</p>
      </>
    )
  } else if (result) {
    const left = room.players.filter((p) => fingers(p.userId) > 0)
    headline = (
      <>
        <div className={cn('game-pop flex flex-col items-center gap-2 rounded-3xl p-5 text-center', tintClass(pack.tint))}>
          <Hand className="size-10" aria-hidden="true" />
          <span className="text-sm opacity-80">{t('rooms.party.whoHas')}</span>
          <span className="text-2xl font-medium" role="status">
            {result.haveIds.length ? result.haveIds.map(name).join(', ') : t('rooms.party.nobody')}
          </span>
        </div>
        {left.length <= 1 && (
          <div className={cn('game-pop flex items-center justify-center gap-2 rounded-2xl p-3 font-medium', TONE_CLASS.success)}>
            <Trophy className="size-5" aria-hidden="true" />
            {left.length === 1 ? t('rooms.party.winner', { name: left[0].displayName }) : t('rooms.party.allOut')}
          </div>
        )}
        <PlayerList room={room} highlight={result.haveIds} extra={fingerBadge} />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      {headline}
      {isHost ? (
        <>
          <Button
            size="lg"
            className="h-14 text-lg"
            disabled={start.isPending}
            onClick={() => {
              next()
              if (game === 'mostLikely') celebrate()
            }}
          >
            {t('rooms.party.nextCard')}
            <ChevronRight data-icon="inline-end" />
          </Button>
          <Button variant="outline" onClick={() => lobby.mutate(undefined, { onError })}>
            {game === 'neverHave' ? t('rooms.party.restart') : t('rooms.backToLobby')}
          </Button>
        </>
      ) : (
        <p className="text-center text-sm text-muted-foreground">{t('rooms.party.waitNext', { name: name(room.hostId) })}</p>
      )}
    </div>
  )
}

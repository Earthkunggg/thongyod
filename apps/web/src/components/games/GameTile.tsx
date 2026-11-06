import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight, CircleHelp, Smartphone, User, Users, Wifi, type LucideIcon } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import type { Game } from '@/config/games'
import { SHOW_BACK } from '@/lib/nav'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { HowToPlaySheet } from './HowToPlay'

type Tag = 'onePhone' | 'rooms' | 'solo'
const TAG_ICON: Record<Tag, LucideIcon> = { onePhone: Smartphone, rooms: Wifi, solo: User }

/** How a game can be played, shown as tags on the card. */
function gameTags(game: Game): Tag[] {
  if (game.mode === 'solo') return ['solo']
  return game.rooms ? ['onePhone', 'rooms'] : ['onePhone']
}

// One game card (#85): white card, colour only on the icon, name, one line, players, and a หลายเครื่อง tag
// when the game can also be played on several phones (the section heading already says เครื่องเดียว / คนเดียว).
// A game with both ways opens a sheet to choose; "เร็วๆ นี้" games are shown but not tappable.
export function GameTile({ game, className }: { game: Game; className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [choose, setChoose] = useState(false)
  const [howTo, setHowTo] = useState(false)
  const [min, max] = game.players
  const players = min === max ? t('games.playersOne', { count: min }) : t('games.players', { min, max })
  const tags = gameTags(game)
  const body = (
    <>
      <span className={cn('grid size-11 place-items-center rounded-xl', tintClass(game.tint))}>
        <game.icon className="size-6" aria-hidden="true" />
      </span>
      <span className="mt-1.5 text-sm font-medium">{t(`games.list.${game.id}.title`)}</span>
      <span className="line-clamp-2 text-xs text-muted-foreground">{t(`games.list.${game.id}.desc`)}</span>
      <span className="mt-auto flex w-full flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="size-3" aria-hidden="true" />
          {game.status === 'soon' ? t('explore.soon') : players}
        </span>
        {tags.includes('rooms') && (
          <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
            <Wifi className="size-3" aria-hidden="true" />
            {t('games.tags.rooms')}
          </span>
        )}
      </span>
    </>
  )
  const classes = cn('flex min-h-40 flex-col items-start gap-0.5 rounded-2xl border bg-card p-3 text-left text-card-foreground', className)

  if (game.status !== 'ready') {
    return (
      <div className={cn(classes, 'opacity-55')} aria-label={t(`games.list.${game.id}.title`) + t('explore.lockedSuffix')}>
        {body}
      </div>
    )
  }
  if (!tags.includes('rooms')) {
    return (
      <Link to={game.to} state={SHOW_BACK} className={cn(classes, 'transition-transform active:scale-[0.97]')}>
        {body}
      </Link>
    )
  }

  const go = (to: string) => {
    setChoose(false)
    void navigate(to, { state: SHOW_BACK })
  }
  return (
    <>
      <button type="button" onClick={() => setChoose(true)} aria-haspopup="dialog" className={cn(classes, 'transition-transform active:scale-[0.97]')}>
        {body}
      </button>
      <BottomSheet open={choose} onOpenChange={setChoose} title={t('games.chooseHow', { game: t(`games.list.${game.id}.title`) })}>
        <div className="flex flex-col gap-2 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          {(
            [
              { tag: 'onePhone', to: game.to },
              { tag: 'rooms', to: `/games/rooms/new?game=${game.id}` },
            ] as const
          ).map(({ tag, to }) => {
            const Icon = TAG_ICON[tag]
            return (
              <button key={tag} type="button" onClick={() => go(to)} className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left active:scale-[0.99]">
                <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl', tintClass(tag === 'rooms' ? 5 : game.tint))}>
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(`games.how.${tag}.title`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`games.how.${tag}.hint`)}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            )
          })}
          <Button variant="ghost" onClick={() => go('/games/rooms')}>
            {t('games.joinFriendRoom')}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setChoose(false)
              setHowTo(true)
            }}
          >
            <CircleHelp data-icon="inline-start" />
            {t('games.howto.button')}
          </Button>
        </div>
      </BottomSheet>
      <HowToPlaySheet game={game.id} open={howTo} onOpenChange={setHowTo} />
    </>
  )
}

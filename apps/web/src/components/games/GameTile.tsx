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

// One game card: tint, icon, name, one line, players, tags (เครื่องเดียว / หลายเครื่อง / คนเดียว).
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
      <game.icon className="size-7" aria-hidden="true" />
      <span className="mt-1 text-sm font-medium">{t(`games.list.${game.id}.title`)}</span>
      <span className="line-clamp-2 text-xs opacity-80">{t(`games.list.${game.id}.desc`)}</span>
      <span className="mt-auto flex flex-wrap items-center gap-1 pt-1.5">
        {tags.map((tag) => {
          const Icon = TAG_ICON[tag]
          return (
            <span key={tag} className="flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[11px] font-medium">
              <Icon className="size-3" aria-hidden="true" />
              {t(`games.tags.${tag}`)}
            </span>
          )
        })}
      </span>
      <span className="flex items-center gap-1 text-[11px] opacity-80">
        <Users className="size-3" aria-hidden="true" />
        {game.status === 'soon' ? t('explore.soon') : players}
      </span>
    </>
  )
  const classes = cn('flex min-h-40 flex-col items-start gap-0.5 rounded-2xl p-3 text-left', tintClass(game.tint), className)

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
              <button key={tag} type="button" onClick={() => go(to)} className={cn('flex items-center gap-3 rounded-2xl p-4 text-left active:scale-[0.99]', tintClass(tag === 'rooms' ? 5 : game.tint))}>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background/60">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{t(`games.how.${tag}.title`)}</span>
                  <span className="block text-xs opacity-80">{t(`games.how.${tag}.hint`)}</span>
                </span>
                <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
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

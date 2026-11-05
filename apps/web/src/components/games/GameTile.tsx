import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Users, Wifi } from 'lucide-react'
import type { Game } from '@/config/games'
import { SHOW_BACK } from '@/lib/nav'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

// One game card: tinted, icon, name, one line, players. "เร็วๆ นี้" games are shown but not tappable.
export function GameTile({ game, className }: { game: Game; className?: string }) {
  const { t } = useTranslation()
  const [min, max] = game.players
  const players = min === max ? t('games.playersOne', { count: min }) : t('games.players', { min, max })
  const body = (
    <>
      <span className="flex w-full items-start justify-between">
        <game.icon className="size-7" aria-hidden="true" />
        {game.rooms && (
          <span className="flex items-center gap-1 rounded-full bg-background/60 px-2 py-0.5 text-[11px] font-medium">
            <Wifi className="size-3" aria-hidden="true" />
            {t('games.roomsBadge')}
          </span>
        )}
      </span>
      <span className="mt-1 text-sm font-medium">{t(`games.list.${game.id}.title`)}</span>
      <span className="line-clamp-2 text-xs opacity-80">{t(`games.list.${game.id}.desc`)}</span>
      <span className="mt-auto flex items-center gap-1 pt-1 text-[11px] opacity-80">
        <Users className="size-3" aria-hidden="true" />
        {game.status === 'soon' ? t('explore.soon') : players}
      </span>
    </>
  )
  const classes = cn('flex min-h-36 flex-col items-start gap-0.5 rounded-2xl p-3 text-left', tintClass(game.tint), className)
  return game.status === 'ready' ? (
    <Link to={game.to} state={SHOW_BACK} className={cn(classes, 'transition-transform active:scale-[0.97]')}>
      {body}
    </Link>
  ) : (
    <div className={cn(classes, 'opacity-55')} aria-label={t(`games.list.${game.id}.title`) + t('explore.lockedSuffix')}>
      {body}
    </div>
  )
}

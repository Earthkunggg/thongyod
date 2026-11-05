// Every game, shown in the "เกม" section on Explore and on /games (DECISIONS #73).
// To add a game: one entry here + `games.list.<id>.title/.desc` in th.ts and en.ts.
import { Bomb, Brush, CupSoda, Dices, Hand, LoaderPinwheel, MessageSquareOff, Pointer, Smartphone, Sparkles, VenetianMask, type LucideIcon } from 'lucide-react'

export type GameId = 'headsUp' | 'spy' | 'taboo' | 'draw' | 'bomb' | 'mostLikely' | 'neverHave' | 'dice' | 'cups' | 'wheel' | 'fortune'

/** How it is played: one phone passed around the group, alone, or each friend on their own phone (rooms). */
export type GameMode = 'onePhone' | 'solo' | 'rooms'

export type Game = {
  id: GameId
  icon: LucideIcon
  /** Category color 1–8 (lib/tones tint). */
  tint: number
  mode: GameMode
  /** Also playable with each friend on their own phone (room). */
  rooms?: boolean
  players: [min: number, max: number]
  status: 'ready' | 'soon'
  to: string
}

export const GAMES: Game[] = [
  { id: 'headsUp', icon: Smartphone, tint: 8, mode: 'onePhone', players: [2, 20], status: 'ready', to: '/head-guess' },
  { id: 'spy', icon: VenetianMask, tint: 6, mode: 'onePhone', rooms: true, players: [3, 12], status: 'soon', to: '/games/spy' },
  { id: 'taboo', icon: MessageSquareOff, tint: 1, mode: 'onePhone', players: [4, 20], status: 'soon', to: '/games/taboo' },
  { id: 'draw', icon: Brush, tint: 2, mode: 'onePhone', players: [2, 20], status: 'soon', to: '/games/draw' },
  { id: 'bomb', icon: Bomb, tint: 3, mode: 'onePhone', players: [2, 20], status: 'soon', to: '/games/bomb' },
  { id: 'mostLikely', icon: Pointer, tint: 5, mode: 'onePhone', players: [3, 20], status: 'soon', to: '/games/most-likely' },
  { id: 'neverHave', icon: Hand, tint: 7, mode: 'onePhone', players: [2, 20], status: 'soon', to: '/games/never' },
  { id: 'dice', icon: Dices, tint: 4, mode: 'onePhone', players: [1, 20], status: 'soon', to: '/games/dice' },
  { id: 'cups', icon: CupSoda, tint: 6, mode: 'solo', players: [1, 1], status: 'soon', to: '/games/cups' },
  { id: 'wheel', icon: LoaderPinwheel, tint: 3, mode: 'solo', players: [1, 20], status: 'ready', to: '/wheel' },
  { id: 'fortune', icon: Sparkles, tint: 4, mode: 'solo', players: [1, 1], status: 'ready', to: '/fortune' },
]

export const gameById = (id: GameId) => GAMES.find((g) => g.id === id)!

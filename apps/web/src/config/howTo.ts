// "วิธีเล่น" tutorial steps for every game: one icon per step. Text lives in i18n games.howto.<game>.s<n>.title/.text
// (and .goal). To add a step: add an icon here and s<n> in th.ts + en.ts.
import {
  ArrowDownUp, Ban, Bomb, Brush, CandyCane, Check, Crown, Dices, Eye, Hand, HandCoins, Hourglass, ListChecks, MessageCircle,
  History, Pointer, RotateCw, Shuffle, Smartphone, Sparkles, Timer, Trophy, Users, VenetianMask, Vote, Wine, type LucideIcon,
} from 'lucide-react'
import type { GameId } from './games'

export const HOW_TO: Record<GameId, LucideIcon[]> = {
  headsUp: [Smartphone, MessageCircle, ArrowDownUp, Trophy],
  spy: [Users, VenetianMask, MessageCircle, Vote, Crown],
  taboo: [Users, Ban, Timer, Check, Trophy],
  draw: [Eye, Brush, MessageCircle, Check, Trophy],
  bomb: [ListChecks, MessageCircle, Hand, Bomb],
  mostLikely: [Users, MessageCircle, Hourglass, Pointer],
  neverHave: [Hand, MessageCircle, Hand, Crown],
  dice: [Dices, Smartphone, Wine, Sparkles],
  cups: [CandyCane, Shuffle, Pointer, Trophy],
  wheel: [ListChecks, RotateCw, HandCoins],
  fortune: [Smartphone, Sparkles, History],
}

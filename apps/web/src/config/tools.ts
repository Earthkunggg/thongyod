// Everything the user can do, shown as cards on the "ทำอะไรดี" (Explore) page.
// To add a feature: add one entry here + its texts in i18n (tools.<id>.title / .desc).
// status: 'ready'  = card opens `to` (page may still be a placeholder while being built)
//         'soon'   = locked card labelled "เร็วๆ นี้" (later versions)
import {
  Calculator,
  CalendarDays,
  CalendarPlus,
  CheckSquare,
  Layers,
  LoaderPinwheel,
  PawPrint,
  Sparkles,
  Palette,
  Receipt,
  Shuffle,
  Smartphone,
  Timer,
  ThumbsUp,
  type LucideIcon,
} from 'lucide-react'

export type ToolId =
  | 'createMeetup'
  | 'quickVote'
  | 'headsUp'
  | 'wheel'
  | 'fortune'
  | 'restaurantVote'
  | 'splitBill'
  | 'randomRestaurant'
  | 'playPet'
  | 'luckyColor'
  | 'myMeetups'
  | 'gradeCalculator'
  | 'focusTimer'
  | 'flashcards'

export type Tool = {
  id: ToolId
  icon: LucideIcon
  group: 'friends' | 'solo'
  status: 'ready' | 'soon'
  /** Route path. Required when status is 'ready'. */
  to?: string
  /** Shown as the big highlighted card at the top of its group. */
  featured?: boolean
}

export const TOOLS: Tool[] = [
  { id: 'createMeetup', icon: CalendarPlus, group: 'friends', status: 'ready', to: '/meetups/new', featured: true },
  { id: 'quickVote', icon: CheckSquare, group: 'friends', status: 'ready', to: '/quick-vote' },
  { id: 'headsUp', icon: Smartphone, group: 'friends', status: 'ready', to: '/head-guess' },
  { id: 'restaurantVote', icon: ThumbsUp, group: 'friends', status: 'ready', to: '/restaurant-vote' },
  { id: 'splitBill', icon: Receipt, group: 'friends', status: 'ready', to: '/bills' },
  { id: 'wheel', icon: LoaderPinwheel, group: 'solo', status: 'ready', to: '/wheel' },
  { id: 'fortune', icon: Sparkles, group: 'solo', status: 'ready', to: '/fortune' },
  { id: 'randomRestaurant', icon: Shuffle, group: 'solo', status: 'ready', to: '/random-restaurant' },
  { id: 'playPet', icon: PawPrint, group: 'solo', status: 'ready', to: '/pet' },
  { id: 'luckyColor', icon: Palette, group: 'solo', status: 'ready', to: '/lucky-color' },
  { id: 'myMeetups', icon: CalendarDays, group: 'solo', status: 'ready', to: '/meetups' },
  { id: 'gradeCalculator', icon: Calculator, group: 'solo', status: 'soon' },
  { id: 'focusTimer', icon: Timer, group: 'solo', status: 'soon' },
  { id: 'flashcards', icon: Layers, group: 'solo', status: 'ready', to: '/flashcards' },
]

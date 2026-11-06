# Component Registry — Thongyod (apps/web)

**Rule:** before creating a component, search this list. If a similar one exists, extend it with props/variants instead of creating a new one. Every new component must be added here in the same commit.

- `ui/` = base components copied from shadcn/ui (Base UI + Tailwind). Edit them freely; they are our code now.
- App components (built from `ui/`) live in `src/components/<area>/`.
- **No UI text in components.** Use `t('key')` from react-i18next; add the key to both `src/i18n/locales/th.ts` and `en.ts`.

| Component | Path | Source / License | Purpose | Variants / props | Notes |
|---|---|---|---|---|---|
| Button | `src/components/ui/button.tsx` | shadcn/ui (MIT) via `shadcn add`, Base UI | All buttons | variant: default, outline, secondary, ghost, destructive, link · size: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg | Sizes changed for touch: default/icon 44px, lg 48px, sm 36px, xs 28px (xs/sm only for dense non-primary UI). |
| AppShell | `src/components/layout/AppShell.tsx` | ours | Frame for all tab pages: content + bottom tab bar, phone width, safe-area padding | — | Used as the parent route in `src/router.tsx` |
| BottomNav | `src/components/layout/BottomNav.tsx` | ours (icons: lucide-react, ISC) | Bottom tabs: หน้าหลัก / แก๊ง / ทำอะไรดี (center, raised) / น้อง / ฉัน | — | Tabs listed in the `TABS` array |
| PageHeader | `src/components/layout/PageHeader.tsx` | ours | Page title + optional subtitle + optional right-side action + optional back button | title, subtitle?, action?, backTo? | Use on every page instead of a custom `<h1>`. `backTo` = fallback when there is no history (page opened from a link) |
| SubPageShell | `src/components/layout/SubPageShell.tsx` | ours | Frame for full-screen pages (tools, details): no tab bar | — | Parent route for non-tab pages in `src/router.tsx` |
| Placeholder | `src/components/layout/Placeholder.tsx` | ours | Dashed box for pages not built yet | text | Temporary; delete when no page uses it |
| Input | `src/components/ui/input.tsx` | ours on Base UI Input (MIT) | Text input, 44px tall, 16px text (no iOS zoom) | all input props | |
| Dialog, DialogContent, DialogClose | `src/components/ui/dialog.tsx` | ours on Base UI Dialog (MIT) | Centered popup with title/description | DialogContent: title, description? | Control with `open`; `disablePointerDismissal` when a choice is required |
| Card | `src/components/ui/card.tsx` | ours (shadcn style) | Surface for grouped content (rounded, border, card colors) | className | Use instead of hand-written bordered divs |
| SectionHeader | `src/components/common/SectionHeader.tsx` | ours | Small heading above a group of cards | title, action?, muted? (quiet h3 inside a Home zone) | |
| IconTile | `src/components/common/IconTile.tsx` | ours | Rounded square with an icon at the start of rows/tool cards | icon, tone: accent \| neutral | accent = group/important, neutral = solo/secondary |
| ListRow | `src/components/common/ListRow.tsx` | ours | One row in a list card: leading + title + subtitle (+ chevron when linked) | leading?, title, subtitle?, to?, trailing?, linkState? (router state, e.g. SHOW_BACK) | Rows add a top border between each other automatically. `trailing` = buttons on the right (not with `to`). |
| Avatar | `src/components/common/Avatar.tsx` | ours | Circle with the first letter of a name (skips Thai leading vowels) | name | Photos later |
| ResponsePicker | `src/components/meetup/ResponsePicker.tsx` | ours | ไป / อาจจะ / ไม่ไป buttons for a meetup (built on SegmentedChoice) | value, onChange, label | Use everywhere a meetup can be answered |
| GameCard | `src/components/games/GameCard.tsx` | ours | The big party-game card: text as large as fits (FitText), new card dealt in with a 3D turn (`back` = from the left) | cardKey, text, tint, eyebrow, onTap, back | ใครน่าจะ…, ไม่เคย…, later ระเบิดเวลา / คำต้องห้าม |
| DrawCanvas | `src/components/games/DrawCanvas.tsx` | ours | Finger drawing surface: smooth strokes (coalesced events), undo, clear, retina-sharp, keeps the drawing on rotate, no page scroll while drawing | ref (clear/undo), color, size, erase, label | วาดแล้วทาย; pen colors come from theme CSS variables |
| FlipCard | `src/components/games/FlipCard.tsx` | ours | Card that turns over in 3D between two faces (secret roles, the word to draw) | flipped, front, back, className (size) | สายลับ role reveal |
| PassPhone | `src/components/games/PassPhone.tsx` | ours | Full cover "ส่งมือถือให้ X" between players on one phone; tap anywhere to continue | title, hint, action, onContinue | Every pass-the-phone game |
| PackPicker | `src/components/games/PackPicker.tsx` | ours | Content packs as tinted tiles; single (radio) or `multiple` (checkbox, one always stays on) | packs, value[], onChange, multiple, label | Party games, สายลับ; use for any game content picker |
| BottomAction | `src/components/games/BottomAction.tsx` | ours | The fixed hero button bar in the thumb zone (safe-area aware) | children | Setup screens (leave `pb-28` on the page) |
| TimerBar | `src/components/games/TimerBar.tsx` | ours | Time-left bar + m:ss, warning tone in the last 10 s | left, total | With `useCountdown` |
| BottomSheet | `src/components/ui/bottom-sheet.tsx` | Base UI Drawer | Sheet that slides up from the bottom: opens at ~62%, drag up for full, swipe down / backdrop to close; title + action + pinned footer | open, onOpenChange, title, action, footer | Notifications on Home; use for any "peek without leaving the page" list |
| NotificationsSheet | `src/components/notifications/NotificationsSheet.tsx` | ours | Newest 12 notifications in a BottomSheet, อ่านทั้งหมด, ดูทั้งหมด → /notifications | open, onOpenChange | The Home bell |
| RoomLobby / PlayerList | `src/features/rooms/RoomParts.tsx` | ours | The waiting room every room game shares (invite ways, players, host settings slot, start/leave); player grid with optional highlight and per-player extra | room, isHost, minPlayers, onStart, onLeave, children | SpyRoom, PartyRoom |
| PartyRoom | `src/features/rooms/PartyRoom.tsx` | ours | ใครน่าจะ… / ไม่เคย… on many phones: answer on your phone, live answered count, results (anonymous vote bars / who has + fingers) | room, meId, onLeave | RoomPage |
| RoomShare | `src/features/rooms/RoomShare.tsx` | ours | Every way into a room: big 6-digit code (copy), invite from friends (sheet), room QR, share/copy link | code, exclude (player ids) | Room lobby; reuse for other room games |
| InviteFriendsSheet | `src/features/rooms/InviteFriendsSheet.tsx` | ours | Search + tick friends, send room invites | code, open, onOpenChange, exclude | From RoomShare |
| HowToPlaySheet / HowToButton / GameHeaderActions | `src/components/games/HowToPlay.tsx` | ours | "วิธีเล่น" tutorial in a BottomSheet: goal + one illustrated step at a time; `GameHeaderActions` = ? + sound for a game's PageHeader | game (GameId) | Every game page. Steps: icons in `config/howTo.ts`, text in `games.howto.<id>` |
| FortuneCup | `src/features/fortune/FortuneCup.tsx` | ours (Earth's art) | เซียมซี cup from `assets/fortune` (cut from image/12-fortune.png): idle sway, rattle, one stick slides out and drops in front with sparkles; `rest` = stick already lying | state, stick | เซียมซี page; all motion in `fortune.css` |
| FortuneCard | `src/features/fortune/FortuneCard.tsx` | ours | The fortune paper: level, 4-line verse appearing line by line, meaning, study / money / love / friends, lucky thing | stick | เซียมซี page + history |
| GameTile | `src/components/games/GameTile.tsx` | ours | One game card (tint, icon, name, one line, players, "หลายเครื่อง" badge); not tappable while `soon` | game, className | Used on /games and the Explore เกม section. Add games in `config/games.ts`. |
| SegmentedChoice | `src/components/common/SegmentedChoice.tsx` | ours | Pick one of 2-4 options as equal-width buttons (generic `<T>`) | options, value, onChange, label | Used by ResponsePicker, theme and language settings |
| ModeChoice | `src/components/common/ModeChoice.tsx` | ours (wraps SegmentedChoice) | Light / dark / follow device picker | value, onChange | Use with `getMode` / `setMode` from `lib/theme`. |
| Pet (size = footprint incl. motion room, #80) | `src/components/pet/Pet.tsx` + `species.ts` + `pet.css`; rules `features/pet/behavior.ts`, moves `features/pet/motions.ts` (art in `src/assets/pets/v2/<species>/`, pipeline `tools/pet-art/`) | ours; Earth's pose sheets traced with vtracer (MIT) | 12 pose drawings on one shared canvas (size never changes between poses); always breathing/floating; blink layer; moves via Web Animations with the pose swapped at the squashed moment; tap = happy / wave / shy, hold = hug, idle = play moves (yawns at night), sleep, `run('eat')`, dances once when all daily missions are done | species ('dragon' \| 'fish'), size, ref (`run(act)`), onTap | Add a species = run the pipeline + one entry in `species.ts`. Pauses when hidden; reduced motion = pose swaps only. |
| Egg | `src/components/pet/Egg.tsx` (+ `pet.css`) | ours (SVG) | Pet egg in 3 styles: fire (→ dragon), sleepy (→ fish), mystery (random) | style, state ('idle' \| 'wobble' \| 'crack'), className | Used in onboarding; reuse for future egg rewards. |
| MonthGrid | `src/components/common/MonthGrid.tsx` | ours | Full month grid (Mon first): today filled, selected ring, up to 3 dots per day (hollow first dot = waiting for my answer) + legend; swipe left/right = change month | month, today, selected, onSelect, marks (Map dayKey → {count, needsAnswer}), onSwipeMonth? | Logic in `features/calendar/month.ts` (tested). Reuse later for classes, exams, holy days. Page must also show ‹ › buttons (gesture rule). |
| WeekStrip | `src/components/home/WeekStrip.tsx` | ours | Mon-Sun strip, today filled, selected ring, dot = has meetup | today, selected, onSelect, markedDays | Later: classes, exams, holy days as extra dots |
| SwipeDeck | `src/components/common/SwipeDeck.tsx` | ours (no library: pointer events + CSS) | Stack of cards (2 visible behind) answered by swiping left / up / right or with the round buttons; stamps while dragging; rubber-band drag limit; tap = onOpen; keyboard ← ↑ → and Enter | items, getKey, renderCard, actions [{dir,label,icon,tone}], onSwipe, onOpen?, label, tall? | DECISIONS #46/#57. For invites use `useInviteActions()` + `SWIPE_TO_RESPONSE`. | `bare`: renderCard draws its own surface (flashcards use a 3D FlipCard).
| SeeAllLink | `src/components/common/SeeAllLink.tsx` | ours | "ดูทั้งหมด ›" link for a SectionHeader action | to, label? | Use whenever a section shows only part of a list (#59). |
| FeedRow | `src/components/home/FeedRow.tsx` | ours | One friends' update in a vertical list (avatar, 2-line sentence, gang · time ago) | item, now | Not a link until FeedItem has target ids. |
| GangAvatar | `src/components/gang/GangAvatar.tsx` | ours | Gang picture placeholder: first letter in a stable tint (hash of id → tint 1–8) | id, name, className | Replace with the gang photo when gangs get pictures. |
| CountBadge | `src/components/common/CountBadge.tsx` | ours | Red number on an icon ("9+" above 9), hidden at 0 | count, className | Tab bar (waiting invites) and Home bell. Wrap the icon in `relative`. |
| NotificationRow | `src/components/notifications/NotificationRow.tsx` | ours | One notification: actor avatar + kind icon, sentence (`notificationText`), time ago, unread dot | item, now, onOpen | Kind → icon/tone map inside. |
| SoundToggle | `src/components/common/SoundToggle.tsx` | ours | 🔊/🔇 button for a game header, per game, default on | game | Read the value with `useGameSound(game)` (`lib/soundPrefs.ts`). |
| ChipSelect | `src/components/common/ChipSelect.tsx` | ours | Wrap of chips, many (checkbox) or one (radio) | options {value,label,icon?}, value[], onChange, label, single? | Filters/categories. For 2–4 equal options use SegmentedChoice. |
| RestaurantDialog | `src/components/restaurants/RestaurantDialog.tsx` | ours | Add/edit a pinned place | open, onOpenChange, restaurant | |
| FitText | `src/components/common/FitText.tsx` | ours | Biggest font size (min–max) that fits its box in ≤ N lines; re-fits on resize/rotation | text, max, min?, maxLines? | Game words, big numbers. |
| FitText | `src/components/common/FitText.tsx` | ours | Biggest font size that fits the box in ≤ N lines (re-measures on resize) | text, max, min?, maxLines?, className | Game words, big numbers. |
| HScroll | `src/components/common/HScroll.tsx` | ours | Sideways scrolling row with snap (cards peek from the right), hidden scrollbar | label, children (`shrink-0 snap-start`), onScroll | Use for any horizontal card row (Home highlights, pending, feed, discover). |
| Badge | `src/components/common/Badge.tsx` | ours | Rounded pill with a meaning color | tone ('warning' \| 'success' \| 'info' \| 'danger' \| 'accent' \| 'neutral'), icon, children | Colors from `lib/tones.ts`; never write palette colors in components (DECISIONS #55). |
| Home zones | `src/components/home/{HomeZone,HomeGreeting,DailyMissions,QuickTools,WeekStrip,FeedRow}.tsx` | ours | Home = 4 zones (#83): `HomeZone` (big title + line between zones) holding วันนี้ (swipe deck, week + agenda, ต้องจัดการ list), เพื่อน (FeedRow list), น้อง (DailyMissions rows), ทางลัด (QuickTools, 4 tiles) | HomeZone: title, action?, children | Inside a zone use `SectionHeader muted` and vertical lists; no sideways rows except the swipe deck. Zone order/visibility: Settings → หน้าหลัก (`features/settings/homeLayout.ts`). |
| SpinWheel | `src/components/common/SpinWheel.tsx` | ours (SVG + CSS transition) | Wheel of names with a fixed top pointer; animates to the `rotation` it is given; tap = spin / skip | options, rotation, durationMs, onSpinEnd, onTap, label | Draws only. Pick the winner with `features/wheel/logic` (`spin()` = secure random first, then the stop angle). Up to 12 slices; labels cut at 10 chars. |
| InviteCard | `src/components/meetup/InviteCard.tsx` | ours | Face of an invite in the deck: gang, title, when + countdown, going avatars, hide link | meetup, now, onHide? | Replaces WaitingMeetupCard (removed). |
| MeetupRow | `src/components/meetup/MeetupRow.tsx` | ours | One meetup in a day agenda: time, title, gang, going avatars, my answer, › ; links to `/meetups/:id` | meetup, showDay? (adds the day above the time for mixed-day lists) | Used by Home agenda, Calendar, นัดของฉัน, profiles. |
| ResponseChip | `src/components/meetup/ResponseChip.tsx` | ours | Small label with my answer or "ยังไม่ตอบ" | response | |
| HideMeetupButton | `src/components/meetup/HideMeetupButton.tsx` | ours | "ซ่อนนัดนี้ (ไม่บอกใคร)" quiet button (#32) | onClick, disabled | Never show to the meetup creator. |
| AvatarStack | `src/components/common/AvatarStack.tsx` | ours | Overlapping small avatars + "+N" | names, total | |
| LoadingState | `src/components/common/LoadingState.tsx` | ours | Skeleton rows while loading | rows | Every page uses LoadingState / ErrorState / EmptyState (#37). |
| ErrorState | `src/components/common/ErrorState.tsx` | ours | Load failed + "ลองอีกครั้ง" | onRetry | |
| EmptyState | `src/components/common/EmptyState.tsx` | ours | "Nothing here" text | title, hint, action | |
| Skeleton | `src/components/ui/skeleton.tsx` | shadcn/ui (MIT), written by hand | Grey pulsing block | className | |
| Toaster | `src/components/ui/toaster.tsx` | Base UI Toast (MIT), styled by us | Draws toasts above the tab bar, newest only | — | Mounted once in `main.tsx`. Show toasts with `showUndoToast` / `showErrorToast` from `src/lib/toast.ts`, never a custom popup. |
| SubTabs | `src/components/layout/SubTabs.tsx` | ours | Tabs inside a page that change the URL (แก๊ง \| เพื่อน) | tabs, label | |
| FriendActionButton | `src/components/friends/FriendActionButton.tsx` | ours | The one button for a person: เพิ่มเพื่อน / ส่งคำขอแล้ว (cancel) / รับ / เป็นเพื่อนกันแล้ว | user (UserCard) | |
| PersonCardRow | `src/components/friends/PersonCardRow.tsx` | ours | Person from search or friend link + FriendActionButton | user | |
| QrCodeCard | `src/components/friends/QrCodeCard.tsx` | qrcode.react 4.2.0 (ISC) | QR of a URL, black on white in every theme | value, label | Reuse for PromptPay QR (M4). |
| QrScanner | `src/components/scan/QrScanner.tsx` | qr-scanner 1.4.2 (MIT) | Live camera QR reader, no shutter | onRead (return true to stop) | Camera needs https or localhost. Reuse for PromptPay scanning. |
| AppScanner | `src/components/scan/AppScanner.tsx` | own | **The one app scanner** (#82): QrScanner + routing via `features/scan/route.ts` `scanTarget()` — friend → /add, room → room, meetup → meetup, our page → page; payment / not-ours QR shows a line and keeps scanning | onDone? | Use this for any "scan" button that should go somewhere. Not for PromptPay input (that one reads a payee, use QrScanner). |
| ScanDialog | `src/components/scan/ScanDialog.tsx` | own | AppScanner in a Dialog; camera runs only while open | open, onOpenChange | Home header, rooms page. |
| Switch | `src/components/ui/switch.tsx` | Base UI Switch (MIT), styled by us | On/off toggle | checked, onCheckedChange, aria-label | Touch area enlarged with a pseudo-element. |
| ProfileView | `src/components/profile/ProfileView.tsx` | ours | Facebook-style profile (cover, avatar, name, title, bio, stats, titles, pet) | profile, actions | Same view for me (`/me`) and others (`/u/:userId`) — decision #36. |
| OptionList | `src/components/common/OptionList.tsx` | ours | Pick one item from a vertical list (radio list in a card), e.g. choose a gang | options {value,label,description?}, value, onChange, label | For 2-4 short options in a row use SegmentedChoice. |
| SuggestionChips | `src/components/common/SuggestionChips.tsx` | ours | Small tappable suggestions that fill a field | items, onPick, label | |
| ToolRow | `src/components/explore/ToolRow.tsx` | ours | One tool on Explore as a ListRow (IconTile accent = with friends, neutral = solo; 'soon' = lock, not tappable) | tool | Was ToolTile (2-column tiles) until #84. |
| FeaturedAction | `src/components/explore/FeaturedAction.tsx` | ours | Big highlighted card for a group's main action (ชวนนัด) | tool | |
| NumberStepper | `src/components/common/NumberStepper.tsx` | ours | − value + for small whole numbers | value, onChange, min, max, label | |
| Quick vote screens | `src/features/quick-vote/*.tsx` | ours | SetupForm, VoteScreen, HandoffScreen, ResultView, TieDialog | — | Feature-only; logic in `logic.ts` (tested) |

| Flashcard pages | `src/pages/Flashcard{s,Deck,Study}Page.tsx` | ours | Deck list / editor / swipe study | — | Logic `features/flashcards/logic.ts` (tested), storage `useDecks()`, `saveDeck()`, `getDeck()`. Study reuses SwipeDeck with 2 actions. |
| Heads-up screens | `src/features/heads-up/{SetupScreen,PlayScreen,ResultScreen}.tsx` | ours | ใบ้บนหัว setup / full-screen round / result | see files | Feature-only; logic in `logic.ts` (tested), sensors in `useTilt.ts`. |

## Shared hooks (not components, but reuse them the same way)

- `src/lib/sound.ts` → `unlockSound()` (call in a tap), `playSound(name)`, `buzz(pattern)`: short synthesized game sounds + Android vibration. Reuse for the wheel, celebrations and other games.
- `src/features/heads-up/useTilt.ts` → `tiltSupport()`, `requestTiltPermission()`, `useTiltStream(active, onZ)` (with 1.5 s watchdog), `useWakeLock(active)`, `enterLandscape()` / `leaveLandscape()`.
- `src/config/wordPacks.ts` → `WORD_PACKS`: word packs for word games (reuse for future word games).

- `src/features/fortune/useShake.ts` → `useShake(onShake, enabled)` + `createShakeDetector()` (pure, tested): phone-shake input with iOS permission handling. Reuse for any shake feature; the tilt game needs its own tilt detector (UX_GUIDELINES §4).
- `src/lib/tones.ts` → `TONE_CLASS`, `TONE_TEXT`, `tintClass(n)`: theme-aware colors (DECISIONS #55).
- `src/lib/nav.ts` → `SHOW_BACK`: pass as Link `state` when linking INTO a tab page so it shows a back button. `profileLink(userId, myId)` → `/me` for me, `/u/:id` for others.
- `src/lib/date.ts` → `formatDayCompact()`: "วันนี้" / "พรุ่งนี้" / "24 พ.ย." for narrow columns.
- `src/features/daily/daily.ts` → `markDone(mission)`, `useDaily()`, `streakOf()`: daily missions (call `markDone('tool')` when a new tool is used).
- `src/lib/celebrate.ts` → `celebrate()`: confetti for peak moments only (result, all paid, hatch). canvas-confetti 1.9.4, ISC; off with reduced motion.
- `src/config/pending.ts` → `PENDING_ICONS`: icon per "ต้องจัดการ" kind (Home + /pending).
- `src/features/fortune/storage.ts` → `loadHistory()` (60 days, `addToHistory` tested); `features/fortune/levelTone.ts` → `LEVEL_TONE` badge color per level.
- `src/lib/deck.ts` → `gameDeck(game)`: play order for game content where things already seen on this phone (also on earlier visits) come last; `markSeen(keys)` after showing. Use for every word/card game (#74).
- `src/lib/gameSettings.ts` → `useGameSettings(game, defaults, fix)`: a game's setup remembered on this phone, cleaned by `fix`.
- `src/lib/useCountdown.ts` → `useCountdown(seconds, running, onEnd)`: pausable wall-clock timer; `reset(seconds)` restarts it.
- `src/lib/random.ts` → `secureRandomInt`, `shuffle`, `pickOne` (fair random for every game).
- `src/components/games/games.css` → shared game motion classes: `game-card-in/back`, `game-pop`, `game-breathe`, `game-shake`, `game-count`, `flip-card*` (all off for reduced motion).
- `src/lib/useInfiniteScroll.ts` → `useInfiniteScroll(query)`: ref for an element under a list; loads the next page near the bottom (used by InfiniteList and /notifications).
- `src/features/notifications/prefs.ts` (tested) + `storage.ts` → `useNotifyPrefs()` / `setNotifyPrefs()`: notification settings on this device.
- `src/lib/promptpay.ts` → `parseTarget`, `promptPayPayload(target, satang)`, `targetFromPayload(qrText)`, `maskTarget` (tested against reference payloads). UI: `features/bill-split/PromptPayDialog.tsx` (reuse QrCodeCard + QrScanner).
- `src/lib/id.ts` → `randomId()`: ids for device data; works on http (crypto.randomUUID does not).
- `src/features/lucky-color/taksa.ts` → `taksa(day)`, `colorsFor(day)`, `bangkokDay(now)` (tested); `config/luckyColors.ts` → `LUCKY_HEX` swatches.
- `src/features/restaurants/logic.ts` → `applyFilters`, `filterKey`, `drawNext`, `exclude`, `restart` (spec §8.4 rounds, tested); storage `useRestaurants()`; `useRestaurantSubtitle()`.
- `src/lib/fullscreen.ts` → `useFullscreen()` (supported/active/enter/exit, incl. iPad webkit API), `enterFullscreen()`, `exitFullscreen()`.
- `src/lib/fullscreen.ts` → `useFullscreen()` (live state incl. the browser ✕), `enterFullscreen()`, `exitFullscreen()`; iPad-safe.
- `src/lib/random.ts` → `secureRandomInt(max)`: the one fair random source for every game/tool (tests mock it by passing a `random` function).


| Hook | Path | Purpose |
|---|---|---|
| useMeetupActions | `src/features/meetups/useMeetupActions.ts` | Answer / hide a meetup with optimistic update, undo toast, error toast. Use everywhere a meetup is answered. |
| useMeetupsInRange, useMeetup, useSetMeetupResponse, useSetMeetupHidden | `src/api/meetups.ts` | TanStack Query hooks. Pages never call `fetch` directly. |
| useHome | `src/api/home.ts` | Home summary (pending, pet, lucky color, feed). |
| useFriends, useUserSearch, useMyFriendLink, useFriendLinkOwner, useRegenerateFriendLink, … | `src/api/friends.ts` | Friends data hooks. |
| useFriendActions | `src/features/friends/useFriendActions.ts` | Send / accept / decline / cancel friend requests with toasts and error messages. |
| useNotifications, useUnreadNotifications, useMarkNotificationsRead | `src/api/notifications.ts` | Notifications list (paged, carries unreadCount), bell count, mark read (optimistic). |
| useMe, useProfile, useUpdateMe | `src/api/profile.ts` | Profile data hooks. |
| useMyGangs, useGangList, useGang | `src/api/gangs.ts` | All my gangs (pickers) / paged + search (tab) / one gang (provisional `GangDetail`). |
| useHomeLayout, setHomeLayout | `src/features/settings/homeLayout.ts` | Home card order/visibility (localStorage until the preferences API). |
| checkDisplayName | `src/features/profile/validation.ts` | App-name rules (#40), tested. |
| isLocked, canHide | `src/features/meetups/derive.ts` | Meetup display rules from server data (`responseLocksAt`, creator). |
| lineShareUrl, appUrl | `src/lib/share.ts` | Share text to LINE; full URL of an app page. |
| checkCreateForm, dateFor, combineDateTime, initialDay | `src/features/meetups/createForm.ts` | "ชวนนัด" form rules (tested). `initialDay` reads `?date=` from the calendar. |
| monthGrid, gridRange, groupByDay, dayKey, defaultDay | `src/features/calendar/month.ts` | Month calendar math (tested); `groupByDay` works for any `{ startsAt }` list. |
| useFriendSubtitle | `src/features/friends/useFriendSubtitle.ts` | "สายมู · เพื่อนร่วมกัน 2 คน" line. |

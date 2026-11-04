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
| SectionHeader | `src/components/common/SectionHeader.tsx` | ours | Small heading above a group of cards | title, action? | |
| IconTile | `src/components/common/IconTile.tsx` | ours | Rounded square with an icon at the start of rows/tool cards | icon, tone: accent \| neutral | accent = group/important, neutral = solo/secondary |
| ListRow | `src/components/common/ListRow.tsx` | ours | One row in a list card: leading + title + subtitle (+ chevron when linked) | leading?, title, subtitle?, to?, trailing? | Rows add a top border between each other automatically. `trailing` = buttons on the right (not with `to`). |
| Avatar | `src/components/common/Avatar.tsx` | ours | Circle with the first letter of a name (skips Thai leading vowels) | name | Photos later |
| ResponsePicker | `src/components/meetup/ResponsePicker.tsx` | ours | ไป / อาจจะ / ไม่ไป buttons for a meetup (built on SegmentedChoice) | value, onChange, label | Use everywhere a meetup can be answered |
| SegmentedChoice | `src/components/common/SegmentedChoice.tsx` | ours | Pick one of 2-4 options as equal-width buttons (generic `<T>`) | options, value, onChange, label | Used by ResponsePicker, theme and language settings |
| ModeChoice | `src/components/common/ModeChoice.tsx` | ours (wraps SegmentedChoice) | Light / dark / follow device picker | value, onChange | Use with `getMode` / `setMode` from `lib/theme`. |
| PetCat | `src/components/pet/PetCat.tsx` | ours | PLACEHOLDER pet drawing (SVG) | className | Replace with rendered images of the 3D model |
| Pet | `src/components/pet/Pet.tsx` + `species.ts` + `pet.css` (art in `src/assets/pets/<species>/`) | ours; art traced from `image/*-sheet-v1.png` with vtracer (MIT), optimized with svgo (MIT) | Any pet species: always alive (breathe or float + blink); idle actions after 15 s (puff / bubbles), 30 s (fly / swim), 60 s (sleep); tap = reaction pose + squish + sparkles | species ('dragon' \| 'fish'), size, ref (`run(act)`) | Add a species = add art + one entry in `species.ts`. Pauses when hidden; reduced motion = no bounce/fly/swim. |
| Egg | `src/components/pet/Egg.tsx` (+ `pet.css`) | ours (SVG) | Pet egg in 3 styles: fire (→ dragon), sleepy (→ fish), mystery (random) | style, state ('idle' \| 'wobble' \| 'crack'), className | Used in onboarding; reuse for future egg rewards. |
| MonthGrid | `src/components/common/MonthGrid.tsx` | ours | Full month grid (Mon first): today filled, selected ring, up to 3 dots per day (hollow first dot = waiting for my answer) + legend; swipe left/right = change month | month, today, selected, onSelect, marks (Map dayKey → {count, needsAnswer}), onSwipeMonth? | Logic in `features/calendar/month.ts` (tested). Reuse later for classes, exams, holy days. Page must also show ‹ › buttons (gesture rule). |
| WeekStrip | `src/components/home/WeekStrip.tsx` | ours | Mon-Sun strip, today filled, selected ring, dot = has meetup | today, selected, onSelect, markedDays | Later: classes, exams, holy days as extra dots |
| SwipeDeck | `src/components/common/SwipeDeck.tsx` | ours (no library: pointer events + CSS) | Stack of cards (2 visible behind) answered by swiping left / up / right or with the round buttons; stamps while dragging; rubber-band drag limit; tap = onOpen; keyboard ← ↑ → and Enter | items, getKey, renderCard, actions [{dir,label,icon,tone}], onSwipe, onOpen?, label, tall? | DECISIONS #46/#57. For invites use `useInviteActions()` + `SWIPE_TO_RESPONSE`. |
| SeeAllLink | `src/components/common/SeeAllLink.tsx` | ours | "ดูทั้งหมด ›" link for a SectionHeader action | to, label? | Use whenever a section shows only part of a list (#59). |
| FeedRow | `src/components/home/FeedRow.tsx` | ours | One friends' update in a vertical list (avatar, 2-line sentence, gang · time ago) | item, now | Not a link until FeedItem has target ids. |
| HScroll | `src/components/common/HScroll.tsx` | ours | Sideways scrolling row with snap (cards peek from the right), hidden scrollbar | label, children (`shrink-0 snap-start`), onScroll | Use for any horizontal card row (Home highlights, pending, feed, discover). |
| Badge | `src/components/common/Badge.tsx` | ours | Rounded pill with a meaning color | tone ('warning' \| 'success' \| 'info' \| 'danger' \| 'accent' \| 'neutral'), icon, children | Colors from `lib/tones.ts`; never write palette colors in components (DECISIONS #55). |
| Home sections | `src/components/home/{HomeGreeting,Highlights,QuickTools,DailyMissions,DiscoverRow}.tsx` | ours | Building blocks of Home v2 (DECISIONS #54) | see files | Section order/visibility from `features/settings/homeLayout`. |
| SpinWheel | `src/components/common/SpinWheel.tsx` | ours (SVG + CSS transition) | Wheel of names with a fixed top pointer; animates to the `rotation` it is given; tap = spin / skip | options, rotation, durationMs, onSpinEnd, onTap, label | Draws only. Pick the winner with `features/wheel/logic` (`spin()` = secure random first, then the stop angle). Up to 12 slices; labels cut at 10 chars. |
| InviteCard | `src/components/meetup/InviteCard.tsx` | ours | Face of an invite in the deck: gang, title, when + countdown, going avatars, hide link | meetup, now, onHide? | Replaces WaitingMeetupCard (removed). |
| MeetupRow | `src/components/meetup/MeetupRow.tsx` | ours | One meetup in a day agenda: time, title, gang, going avatars, my answer, › ; links to `/meetups/:id` | meetup | Used by Home agenda, Calendar, นัดของฉัน, profiles. |
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
| QrScanner | `src/components/friends/QrScanner.tsx` | qr-scanner 1.4.2 (MIT) | Live camera QR reader, no shutter | onRead (return true to stop) | Camera needs https or localhost. Reuse for PromptPay scanning. |
| Switch | `src/components/ui/switch.tsx` | Base UI Switch (MIT), styled by us | On/off toggle | checked, onCheckedChange, aria-label | Touch area enlarged with a pseudo-element. |
| ProfileView | `src/components/profile/ProfileView.tsx` | ours | Facebook-style profile (cover, avatar, name, title, bio, stats, titles, pet) | profile, actions | Same view for me (`/me`) and others (`/u/:userId`) — decision #36. |
| OptionList | `src/components/common/OptionList.tsx` | ours | Pick one item from a vertical list (radio list in a card), e.g. choose a gang | options {value,label,description?}, value, onChange, label | For 2-4 short options in a row use SegmentedChoice. |
| SuggestionChips | `src/components/common/SuggestionChips.tsx` | ours | Small tappable suggestions that fill a field | items, onPick, label | |
| PetCard | `src/components/home/PetCard.tsx` | ours | Pet mood + lucky color, links to /pet | pet, luckyColor | Prop `to` (default `/pet`; `null` = not tappable, for friends' pets). |
| ToolTile | `src/components/explore/ToolTile.tsx` | ours | Tool card on Explore; locked style for status 'soon' | tool | Tools are defined in `src/config/tools.ts` |
| FeaturedAction | `src/components/explore/FeaturedAction.tsx` | ours | Big highlighted card for a group's main action (ชวนนัด) | tool | |
| NumberStepper | `src/components/common/NumberStepper.tsx` | ours | − value + for small whole numbers | value, onChange, min, max, label | |
| Quick vote screens | `src/features/quick-vote/*.tsx` | ours | SetupForm, VoteScreen, HandoffScreen, ResultView, TieDialog | — | Feature-only; logic in `logic.ts` (tested) |

## Shared hooks (not components, but reuse them the same way)

- `src/features/fortune/useShake.ts` → `useShake(onShake, enabled)` + `createShakeDetector()` (pure, tested): phone-shake input with iOS permission handling. Reuse for any shake feature; the tilt game needs its own tilt detector (UX_GUIDELINES §4).
- `src/lib/tones.ts` → `TONE_CLASS`, `TONE_TEXT`, `tintClass(n)`: theme-aware colors (DECISIONS #55).
- `src/lib/nav.ts` → `SHOW_BACK`: pass as Link `state` when linking INTO a tab page so it shows a back button.
- `src/features/daily/daily.ts` → `markDone(mission)`, `useDaily()`, `streakOf()`: daily missions (call `markDone('tool')` when a new tool is used).
- `src/lib/celebrate.ts` → `celebrate()`: confetti for peak moments only (result, all paid, hatch). canvas-confetti 1.9.4, ISC; off with reduced motion.
- `src/config/pending.ts` → `PENDING_ICONS`: icon per "ต้องจัดการ" kind (Home + /pending).
- `src/features/fortune/storage.ts` → `loadHistory()` (60 days, `addToHistory` tested); `features/fortune/levelTone.ts` → `LEVEL_TONE` badge color per level.
- `src/lib/random.ts` → `secureRandomInt(max)`: the one fair random source for every game/tool (tests mock it by passing a `random` function).


| Hook | Path | Purpose |
|---|---|---|
| useMeetupActions | `src/features/meetups/useMeetupActions.ts` | Answer / hide a meetup with optimistic update, undo toast, error toast. Use everywhere a meetup is answered. |
| useMeetupsInRange, useMeetup, useSetMeetupResponse, useSetMeetupHidden | `src/api/meetups.ts` | TanStack Query hooks. Pages never call `fetch` directly. |
| useHome | `src/api/home.ts` | Home summary (pending, pet, lucky color, feed). |
| useFriends, useUserSearch, useMyFriendLink, useFriendLinkOwner, useRegenerateFriendLink, … | `src/api/friends.ts` | Friends data hooks. |
| useFriendActions | `src/features/friends/useFriendActions.ts` | Send / accept / decline / cancel friend requests with toasts and error messages. |
| useMe, useProfile, useUpdateMe | `src/api/profile.ts` | Profile data hooks. |
| useHomeLayout, setHomeLayout | `src/features/settings/homeLayout.ts` | Home card order/visibility (localStorage until the preferences API). |
| checkDisplayName | `src/features/profile/validation.ts` | App-name rules (#40), tested. |
| isLocked, canHide | `src/features/meetups/derive.ts` | Meetup display rules from server data (`responseLocksAt`, creator). |
| lineShareUrl, appUrl | `src/lib/share.ts` | Share text to LINE; full URL of an app page. |
| checkCreateForm, dateFor, combineDateTime, initialDay | `src/features/meetups/createForm.ts` | "ชวนนัด" form rules (tested). `initialDay` reads `?date=` from the calendar. |
| monthGrid, gridRange, groupByDay, dayKey, defaultDay | `src/features/calendar/month.ts` | Month calendar math (tested); `groupByDay` works for any `{ startsAt }` list. |
| useFriendSubtitle | `src/features/friends/useFriendSubtitle.ts` | "สายมู · เพื่อนร่วมกัน 2 คน" line. |

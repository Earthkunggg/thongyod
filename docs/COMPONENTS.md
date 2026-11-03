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
| ListRow | `src/components/common/ListRow.tsx` | ours | One row in a list card: leading + title + subtitle (+ chevron when linked) | leading?, title, subtitle?, to? | Rows add a top border between each other automatically |
| Avatar | `src/components/common/Avatar.tsx` | ours | Circle with the first letter of a name (skips Thai leading vowels) | name | Photos later |
| ResponsePicker | `src/components/meetup/ResponsePicker.tsx` | ours | ไป / อาจจะ / ไม่ไป buttons for a meetup (built on SegmentedChoice) | value, onChange, label | Use everywhere a meetup can be answered |
| SegmentedChoice | `src/components/common/SegmentedChoice.tsx` | ours | Pick one of 2-4 options as equal-width buttons (generic `<T>`) | options, value, onChange, label | Used by ResponsePicker, theme and language settings |
| PetCat | `src/components/pet/PetCat.tsx` | ours | PLACEHOLDER pet drawing (SVG) | className | Replace with rendered images of the 3D model |
| WeekStrip | `src/components/home/WeekStrip.tsx` | ours | Mon-Sun strip, today filled, selected ring, dot = has meetup | today, selected, onSelect, markedDays | Later: classes, exams, holy days as extra dots |
| NextMeetupCard | `src/components/home/NextMeetupCard.tsx` | ours | Next meetup + countdown + ResponsePicker | meetup, now, onRespond | |
| PetCard | `src/components/home/PetCard.tsx` | ours | Pet mood + lucky color, links to /pet | pet, luckyColor | |
| ToolTile | `src/components/explore/ToolTile.tsx` | ours | Tool card on Explore; locked style for status 'soon' | tool | Tools are defined in `src/config/tools.ts` |
| FeaturedAction | `src/components/explore/FeaturedAction.tsx` | ours | Big highlighted card for a group's main action (ชวนนัด) | tool | |
| NumberStepper | `src/components/common/NumberStepper.tsx` | ours | − value + for small whole numbers | value, onChange, min, max, label | |
| Quick vote screens | `src/features/quick-vote/*.tsx` | ours | SetupForm, VoteScreen, HandoffScreen, ResultView, TieDialog | — | Feature-only; logic in `logic.ts` (tested) |

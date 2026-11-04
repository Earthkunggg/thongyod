# Thongyod — UX/UI Guidelines (v1, 2026-11-04)

Research-based rules for every screen. Written for the AIs working on this repo (Claude = frontend, Codex = backend) and for Earth.
Status: **proposal — Earth approves before it becomes binding**. Sources at the end. Library versions/licenses checked with `npm view` on 2026-11-04; re-check at install time.

---

## 0. Product feel (one paragraph)

Thongyod is a **student-life toolbox**: many small tools that work alone, and every tool can **invite friends in one tap** (link → LINE). It must feel **alive and playful but never slow**: show things as pictures and motion instead of text, celebrate at the right moments, never punish. Principle from day one: *fast, simple, not annoying* (DECISIONS #7).

---

## 1. Core rules

1. **Show, don't tell.** Every number or state should be readable as a picture in ~1 second; text supports it. (Catalog in §8.)
2. **One hero per screen.** One clear main action, placed in the thumb zone (bottom half), same place on every screen of a flow (Finch critique: consistent primary button).
3. **Delight at peaks, calm in between.** Big effects only at meaningful moments: vote result, bill fully paid, game over, new title, pet hatch (peak-end rule). Everyday taps get only micro feedback.
4. **Never punish, never guilt.** No loss framing, no "you broke your streak", no dying pet or dying tree. Rewards are earned, visible and kept (Finch, streak research).
5. **Everything reversible is undo, not confirm.** Use a 4-second undo toast for reversible actions; confirmation dialogs only for things that are hard to undo (block, delete, regenerate link).
6. **Every gesture has a button.** Swipe, drag, tilt and shake are shortcuts; a visible button always does the same thing (WCAG 2.5.1, 2.5.4, 2.5.7).
7. **Respect the device.** Reduced-motion setting, silent switch, data saver, small screens, mid-range Android.

---

## 2. Motion

**Library:** `motion` (MIT, formerly Framer Motion). Pin a version that has been out ≥2 weeks.
- Use `m` components inside `<LazyMotion features={…} strict>` to keep the first load small (~5 kb + features). `domAnimation` (~24 kb) = animations, variants, exit, tap/hover. **Drag/swipe and layout animations need `domMax` (~38 kb)** → load `domMax` lazily (dynamic import) only on screens with swipe cards / drag.
- Wrap the app in `<MotionConfig reducedMotion="user">` (disables transform/layout animations for users with OS "reduce motion"; opacity/color still animate). Add an in-app switch "ลดการเคลื่อนไหว" that forces `"always"`.
- Animate only `transform` and `opacity` (cheap on mid-range Android). No animated blur/box-shadow on lists.

**Duration tokens** (add to `src/config/motion.ts`):

| Token | ms | Use |
|---|---|---|
| `instant` | 100–150 | button press, toggle, checkbox |
| `quick` | 200–250 | small enter/exit, chips, toasts |
| `standard` | 300 | cards, sheets, page transitions |
| `emphasis` | 400–500 | celebrations, result reveals (bounce/elastic only here) |
| `story` | ≤ 1200 | wheel spin, shuffle, hatch — **always skippable by tap** |

Easing: enter = decelerate (ease-out), exit = accelerate (ease-in, ~20% shorter than enter), drag release = spring. "Feel matters more than exact numbers" — tune on a real phone.

---

## 3. Swipe cards (การ์ดคำชวน, แฟลชการ์ด, ไพ่)

One shared component `SwipeDeck` used everywhere (home invites, flashcards, tarot later).

| Rule | Value |
|---|---|
| Directions | right = ไป / รู้แล้ว · left = ไม่ไป / ยังไม่รู้ · up = อาจจะ (invites only) |
| Commit | drag offset > ~35% of card width **or** fling velocity > ~600 px/s; otherwise spring back |
| Feedback while dragging | card rotates up to ±12°, a stamp ("ไป" / "ไม่ไป" / "อาจจะ") fades in from ~40 px offset, background tint |
| Buttons | 3 round buttons under the deck do the same actions (required: WCAG 2.5.7) + keyboard ← → ↑ |
| Undo | ↩ button + 4 s undo toast (same as today) |
| Silent hide | **button only**, never a swipe direction (too easy to trigger by accident) |
| Accidental swipes | vertical page scroll must still work: lock direction after 10 px; small screens: require larger offset |
| Haptic | short `navigator.vibrate(15)` on commit (Android only) |
| Sound | soft "flick" on commit (optional, see §5) |
| End of deck | cat illustration "ตอบครบแล้ว!" + small confetti burst once |
| Reduced motion | no rotation/fly-out; card fades and next card appears |

Reference: Motion's official MIT "card stack" example (drag + stack) on 21st.dev — adapt, don't copy the visuals of Tinder (their code is closed; brand/visuals are theirs).

---

## 4. Device motion: tilt game "ใบ้บนหัว" and shake (เซียมซี)

**Permissions & platform facts**
- iOS: `DeviceOrientationEvent.requestPermission()` / `DeviceMotionEvent.requestPermission()` **must be called from a tap** and **only works on https or localhost**. Feature-detect the function first. Android Chrome: no prompt.
- Testing on a real phone needs https (deploy or https tunnel) — plan this before building the game.
- Orientation lock (`screen.orientation.lock`) works on Chrome Android (in fullscreen) and Firefox Android 144+, **not on iOS** → if the phone is portrait, show a "หมุนมือถือ" screen and wait.
- Keep the screen awake during a round with the Screen Wake Lock API where supported (ต้องเช็ก support บน iOS ก่อนใช้).
- A known open bug in a public heads-up web clone: iOS sensor events can "freeze" → add a watchdog: if no sensor event for 1.5 s, switch to tap mode automatically.

**Tilt detection (robust in both landscape directions)**
- Use the **gravity vector** (`DeviceMotionEvent.accelerationIncludingGravity`) along the screen normal (z), not Euler angles (beta/gamma swap and jump near 90° in landscape).
- Calibrate on "3-2-1" (phone on forehead = neutral z₀). Correct when z − z₀ crosses +T, pass when it crosses −T (T ≈ 6 m/s² ≈ 35–40°; tune). The sign depends on landscape-left/right: normalize with `screen.orientation.angle`.
- Hysteresis: after a trigger, ignore until the phone returns near neutral (|z − z₀| < 2) + 400 ms cooldown. Throttle handling to ~30 fps.
- **Fallback always on:** tap left half = ผ่าน, right half = ถูก. Settings switch "ใช้การเอียงจอ" (WCAG 2.5.4 lets games use motion, but we still offer it).

**Game UX**
- Flow: เลือกหมวด → เวลา 60/90 s → นับ 3-2-1 (big, with sound) → play → result.
- Correct = full-screen green flash + "ถูก!" + rising sound; pass = orange flash + soft sound; last 10 s ticking.
- Result screen: list of words with ✓/✗, **tap a word to swap correct/pass** (a public clone does this — fixes sensor mistakes), score, "เล่นอีก", share card to LINE.
- Words: written by us, stored in config (`src/config/wordPacks/*.ts`), categories × difficulty, no repeats in a session, no real people, no adult content. Our own game name (not "Heads Up!", a trademark).

---

## 5. Sound

**Default (proposal, changes spec §14 slightly):** UI sounds **off** by default (spec). **Games and celebration screens sound on** by default with a visible 🔊 toggle on that screen. Global settings: master / effects / pet / game volumes.

- Sounds are short (≈ animation length + 0.3 s), subtle, abstract, one consistent style; never the only signal (always paired with visual/haptic); never on every scroll/tap.
- **Respect the iPhone silent switch.** Web Audio is muted by the ringer switch on iOS; do **not** force `navigator.audioSession.type = 'playback'` for UI/game effects — silent means silent.
- iOS/Android need a user tap before audio can start: unlock the audio context on the first tap ("เริ่มเกม" button).
- Sources:
  - **Kenney "Interface Sounds" / "UI Audio" — CC0** (100 OGG files). Convert to `.mp3`/`.m4a` for Safari compatibility; credit Kenney in `docs/CREDITS.md` (not required, but nice).
  - **ZzFX** (MIT, tiny sound generator, no files) for synthesized blips/coins/whoosh — fewer assets to download.
- Playback: a tiny wrapper on Web Audio (`src/lib/sound.ts`) with preloading and per-category volume. `howler` (MIT, last release 2023) only if we need more.

## 6. Haptics

- `navigator.vibrate()` works on Android browsers; **not on iOS in any browser** (Apple). Only short pulses: tap 10 ms, success 15-30-15, error 40-60-40.
- Never required for meaning. Respect a "สั่น" switch in settings.

---

## 7. Onboarding (first launch) and help

NN/g found front-loaded tutorials did **not** improve success on simple apps and made tasks *feel* harder; interactive, just-in-time help works better. So:

1. **≤ 4 screens, ≤ 30 s, "ข้าม" on every screen, progress dots on every screen** (Finch critique).
   1. What Thongyod does (one picture, one line).
   2. **Practice swipe** on a demo invite card (learning by doing).
   3. Choose theme.
   4. **Open the blind box → meet แมวก้อน** (hatch celebration, name your cat) — the reward that ends onboarding (Finch-style adoption).
2. **Permissions just-in-time, never on first launch:** notifications when the user first creates/joins something; motion when they first press "เริ่มเกม"; camera when they first tap "สแกน QR". Explain the benefit in one line before the system prompt.
3. **Contextual tips:** one tip the first time a tool opens (`driver.js`, MIT), stored as seen; "ดูวิธีใช้อีกครั้ง" in Settings. Never chain more than 3 highlights.
4. Swipe hint on the first real deck: the top card wiggles once.

## 8. "Show, don't tell" catalog

| Where | Picture instead of text |
|---|---|
| Invite / meetup size | **seats around a table**: avatars sit in seats, empty seats = "ขาดอีก N", queue beside the table when full |
| Who answered | avatar ring filling up around the count |
| Countdown | shrinking ring, color warms near start |
| Vote results | bars race, then podium 1-2-3 |
| Wheel / random | spinning wheel, card shuffle; **result is decided first with secure random, then animated to it** (fair + testable) |
| Bill | receipt prints line by line; "จ่ายแล้ว" **stamp** animation; QR card flips (amount ↔ QR) |
| GPAX | gauge needle; target slider "ต้องได้เท่าไร" |
| Focus timer | plant grows / cat studies beside you; weekly bars; **leaving pauses and the plant droops — it never dies** |
| Streaks | ทองหยอด beads in a jar, **weekly** goal, earned freeze, no loss message |
| Numbers | count up/down (`@number-flow/react`, MIT) |
| Home | sky follows real time (morning/evening/night stars); seasonal decorations (ลอยกระทง, สงกรานต์, exam week) |
| Empty states | cat doing something related + one action button |
| New title | cat holds the sign (spec §11.2), confetti once |
| Success | `canvas-confetti` (ISC) — small bursts, only at peaks, off with reduced motion |

## 9. Loading, empty, error

- < 1 s: **no indicator** (avoid flicker) → delay skeletons ~300 ms before showing.
- Page loads: skeleton that matches the layout (not just a frame). Single card/module: spinner. > 10 s (uploads): progress bar with estimate.
- Empty: say why it is empty + one action (+ cat). Error: plain Thai, what to do, retry button; keep user input.
- Optimistic updates with rollback (already in use).

## 10. Invites and sharing (core of the new direction)

- Every tool has **"ชวนเพื่อน"** → bottom sheet: pick a gang/friends **or** "ส่งใน LINE" / copy link / QR. Same sheet everywhere.
- Invite links open a page that works **before login** where allowed (spec §15: vote with a nickname); after login return to the same page.
- **Link previews in LINE need server-rendered Open Graph tags** (crawlers don't run JS): `og:title`, `og:description`, `og:image` 1200×630 PNG/JPG (not WebP), absolute https URLs. → backend task (Codex), render per invite without leaking private data.
- Invite **themes/covers** (our own illustrations), playful RSVP labels, and "สะกิด" pokes with the pet (cooldown) — inspired by Partiful's playful invites/"boop". Never parody real people or brands.

## 11. Thai typography and copy

- Line-height ≥ 1.6 (already). Upper/lower marks (เช่น "ขึ้น", "ปู่") can be clipped by `overflow: hidden` / tight line boxes → give truncated lines enough line-height or small vertical padding; check every `truncate`.
- No letter-spacing on Thai text. Short, spoken Thai ("ขาดอีก 2 คน"). Numbers with units.

## 12. PWA realities on iPhone

- Web push only after "Add to Home Screen" (iOS 16.4+) → show our own install guide; there is no install prompt event on iOS.
- Website storage can be cleared by Safari (inactivity / low space) → local-only tool data (grades, flashcards) must say "เก็บในเครื่องนี้" and sync to the account when logged in.
- No orientation lock, no vibration on iOS (see §4, §6).

## 13. Gamification ethics

- Earned rewards only, daily caps (spec), **no real money in blind boxes** (spec).
- Streaks: weekly goals, earned freezes, forgiveness, no "you lost" screens; retire pressure once a habit forms.
- Pet: moods are cute, max level "เหี่ยว", recover by ง้อ (spec §10.3). Same rule for the focus plant.

## 14. Libraries

| Use | Package | Version (checked) | License | Verdict |
|---|---|---|---|---|
| Motion, swipe, drag, springs | `motion` | 14.9.1 (pin an older stable one) | MIT | ✅ |
| Onboarding tips | `driver.js` | 1.10.2 | MIT | ✅ |
| Confetti | `canvas-confetti` | 1.9.4 | ISC | ✅ |
| Animated numbers | `@number-flow/react` | 0.6.2 | MIT | ✅ optional |
| Onboarding slides | `embla-carousel-react` | 8.6.0 | MIT | ✅ optional (or Motion drag) |
| Generated sounds | `zzfx` | 1.4.0 | MIT | ✅ |
| Sound files | Kenney Interface Sounds | — | CC0 | ✅ convert to mp3 |
| Audio playback | `howler` | 2.2.4 (2023) | MIT | only if needed |
| Bottom sheet | Base UI `Drawer` (already installed) | — | MIT | ✅ prefer over `vaul` |
| QR | `qrcode.react`, `qr-scanner` | (installed) | ISC / MIT | ✅ |
| Image crop | `react-easy-crop` | 6.2.4 | MIT | ✅ (paused feature) |
| Swipe cards | `react-tinder-card` | 1.6.4 (2023) | MIT | ❌ React ≤18, old react-spring |
| Wheel | `react-custom-roulette` | 1.4.1 (2023) | MIT | ❌ stale; build our own SVG wheel with Motion |
| Tours | `shepherd.js`, `intro.js` | — | **AGPL-3.0** | ❌ license |
| Heads-up clones on GitHub | Oshanotter/guess-what, Carduelis/heads-up | — | **no license file** | ❌ ideas only, no code |

## 15. Reference apps and what we take

| App | Take | Change for us |
|---|---|---|
| Finch | egg adoption + naming, pet tied to real actions, gentle tone, progress dots | free, no subscription prompts |
| Forest | plant grows while focusing, collection of sessions | leaving pauses/droops, never kills |
| Partiful | playful invites, themes, emoji pokes, yes/no/maybe | LINE-first, original art, no parody of real people |
| Duolingo | celebrations, character personality | no streak guilt |
| Heads-up clones | result screen with swappable answers, pause, sound manager | our own word packs, tap fallback, sensor watchdog |
| LINE | chat-list look for gangs, link sharing | we never replace chat |

## 16. Links that need Earth (Claude cannot open them)

- **motion.dev docs pages** (drag, gestures examples) — blocked for Claude; open https://motion.dev/docs/react-drag and https://motion.dev/examples and paste the parts you like.
- **Mobbin / Pageflows / Screensdesign full flows** — need login/paid; screenshots of Finch, Partiful, Forest, Duolingo, Kahoot flows are great references if you can capture them.
- **Dribbble / Pinterest / Figma Community** — ideas for cute 2D cat style and invite covers (inspiration only; we draw our own).
- **App Store / Play Store preview videos** of "Heads Up!"-style games, Forest, Finch — to feel timing and sounds.
- **MDN pages for Screen Orientation lock and Vibration** were blocked; data above came from caniuse / web-features instead.

## 17. Sources

- NN/g — Mobile tutorials: https://www.nngroup.com/articles/mobile-tutorials/
- NN/g — Skeleton screens: https://nngroup.com/articles/skeleton-screens/
- Motion — Reduce bundle size: https://motion.dev/docs/react-reduce-bundle-size
- Motion — Accessibility: https://motion.dev/motion/guide-accessibility/
- Motion card stack example (MIT): https://21st.dev/@motiondotdev/components/motion-card-stack.md
- Val Head — UI animation durations: https://valhead.com/?p=2978
- WCAG 2.5.4 Motion Actuation: https://tabnav.com/academy/wcag/success-criterion-2.5.4
- MDN — DeviceOrientationEvent.requestPermission: https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/requestPermission_static
- Device Orientation API overview: https://blog.openreplay.com/understanding-device-orientation-api/
- Screen orientation lock support: https://web-platform-dx.github.io/web-features-explorer/features/screen-orientation-lock/
- Vibration support: https://caniuse.com/vibration and https://www.mintlify.com/lochie/web-haptics/advanced/browser-support
- iOS Web Audio and silent switch: https://portfolio-2024-b6r.pages.dev/blog/web-audio-ios-unmute
- Kenney Interface Sounds (CC0): https://opengameart.org/content/interface-sounds
- Sound in UX dos and don'ts: https://uxplanet.org/dos-and-don-ts-of-sound-in-ux-766178f1ae95
- Streak design and burnout: https://yukaichou.com/gamification-analysis/streak-design-gamification-motivation-burnout/
- Finch critique: https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/
- Finch onboarding teardown: https://screensdesign.com/articles/finch-app-onboarding-design/
- Forest review: https://thesweetsetup.com/apps-we-love-forest/
- Partiful: https://www.nbcnewyork.com/news/business/money-report/meet-partiful-the-gen-z-party-planning-staple-thats-taking-on-apple/6231135/
- PWA iOS limitations: https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide
- Open Graph for SPAs: https://dev.to/eatyou_eatyou_d79d27e5622/the-complete-guide-to-open-graph-tags-what-most-developers-get-wrong-1joa
- Heads-up web clones (ideas only): https://github.com/Oshanotter/guess-what , https://www.github.com/Carduelis/heads-up

# Game ideas — proposals for Earth (2026-11-05, Claude)

Status: **proposals only, nothing here is built.** Pick the ones you like; I build them in the order you choose.
Already built: วงล้อสุ่ม, เซียมซี, โหวตด่วน, หารบิล, ใบ้บนหัว (#62), แฟลชการ์ด (#63).

Rules every idea follows (from UX_GUIDELINES / spec): one phone works without login; every gesture has a button; no real money; no guilt; our own content and art; sound on in games with a toggle; no real people or brands; nothing aimed at minors.

## A. Party games on one phone (no backend, fastest to build)

| # | Name (working) | How it plays | Why it fits | Reuses | Effort |
|---|---|---|---|---|---|
| 1 | **ระเบิดเวลา** (hot potato) | Phone shows a topic (e.g. "ของในร้านสะดวกซื้อ", our own topics), say one answer and pass the phone; a hidden random timer (secure random, 15–45 s) ticks faster; whoever holds it when it "explodes" (cute confetti puff, not violent) gets a sticker. | Loud, 10-second rules, perfect at หมูกระทะ. | wordPacks topics, sound, confetti | S |
| 2 | **ใครน่าจะ…** (most likely to) | A card "ใครน่าจะตื่นสายที่สุด"; everyone points on 3-2-1; app only shows the card + timer. Packs: ชีวิตมหาลัย, หอพัก, ทริป. Option "แซวแรง" off by default (spec §11 harsh teasing rule). | Teasing that the group controls, never stored. | SwipeDeck for next card | S |
| 3 | **ไม่เคย…** (never have I ever, clean) | Swipe cards "ไม่เคยดร็อปวิชา"; players count fingers. Clean student-life statements only. | Same deck UI, zero setup. | SwipeDeck | S |
| 4 | **สายลับ** (spyfall-style) | Pass the phone: everyone sees the place (e.g. โรงอาหาร) except 1–2 spies (secure random). Ask questions, vote the spy. Timer + "who was the spy" reveal. Our own places list. | Big hit with Gen Z groups; uses the pass-the-phone pattern from โหวตด่วน. | quick-vote handoff screens, wordPacks.places | M |
| 5 | **คำต้องห้าม** (taboo) | Show a word + 3 words you may not say; team guesses in 60 s; ✓ / ✗ buttons; team scores. | Pairs with ใบ้บนหัว packs and result screen. | heads-up result, timer | M |
| 6 | **วาดแล้วทาย** (one-phone draw) | Drawer sees the word, draws on a canvas with a finger, others guess out loud; tap ✓ to score. | Very visual; no network needed. | wordPacks, canvas | M |
| 7 | **ลูกเต๋า / ปั่นขวด** | Shake the phone → dice (1–6, up to 3 dice) or a spinning bottle that points to a seat. | Tiny, uses the shake detector; board-game nights. | useShake, SpinWheel ideas | S |

## B. Student-life mini games (solo, daily)

| # | Name | How it plays | Why | Effort |
|---|---|---|---|---|
| 8 | **ควิซจากแฟลชการ์ด** | Turn a flashcard deck into 4-choice quizzes (wrong answers from other cards) and "พิมพ์คำตอบ" mode. Quiz widget already exists. | Study + game; reuses decks. | S |
| 9 | **แข่งจำศัพท์ 60 วิ** | Speed round over a deck: how many cards you know in 60 s; personal best per deck. | Same engine as ใบ้บนหัว timer. | S |
| 10 | **ตอบไวเงินเดือนออก** (money sense) | Guess the price band of everyday student items (ข้าวกะเพรา ~50 บาท…) from our own estimates; teaches budgeting lightly. Prices are ranges we write, labelled as estimates. | Ties to หารบิล / future finance tool. | M |

## C. Pet games (feed the pet system, earned rewards only)

| # | Name | How it plays | Why | Effort |
|---|---|---|---|---|
| 11 | **รับขนม** (catch) | Tilt or drag to move your pet and catch falling snacks for 30 s; score → small pet points (daily cap, spec §10.4). | Makes the pet feel alive; reuses tilt sensor. | M |
| 12 | **ซ่อนหา** | The pet hides behind one of 3 cups that shuffle; find it. Fair random decided first, then animated. | 20-second fun, cute, very cheap to build. | S |
| 13 | **เต้นตามจังหวะ** | Tap on the beat while your pet dances (สายเต้น personality). Simple synthesized beat (no copyrighted music). | Matches pet personalities (#47). | M |

## D. Online games with friends (phase C, need the backend)

| # | Name | Notes |
|---|---|---|
| 14 | **ห้องควิซแก๊ง** | Kahoot-style live quiz in a gang; needs real-time voting rooms (spec §17: real-time only on voting screens). |
| 15 | **สุ่มร้านแบบห้อง** | Everyone swipes restaurants (yes/no), the app picks among all-yes (spec §8.6), shared result animation. |
| 16 | **บิงโกเทอม** | Shared bingo card of campus moments ("อาจารย์ปล่อยเร็ว"), each friend ticks on their phone. |

## My recommendation (order)

1. **ใครน่าจะ…** + **ไม่เคย…** (one shared "party deck" engine on SwipeDeck — two games for the price of one).
2. **สายลับ** (most replayable).
3. **ระเบิดเวลา** + **ลูกเต๋า/ปั่นขวด** (small, fun at meals).
4. **ซ่อนหา** + **รับขนม** when the layered pets are ready.
5. **ควิซจากแฟลชการ์ด** for exam season.

Questions for Earth: which ones, and is "แซวแรง" in ใครน่าจะ… okay as an opt-in pack?

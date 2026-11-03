# Thongyod — Project Brief (for AI assistants)

LANGUAGE: Always respond in Thai (simple, beginner-friendly, short sentences). Keep code, file names, commands, technical terms, library and product names in English. When you write a prompt for another AI, write it in English and tell that AI to respond in Thai.

## About me
Earth, 4th-year Computer Science student in Thailand, Windows PC. I know React, Vue 3, TypeScript, NestJS and PostgreSQL but forgot most setup details. Teach step by step: what it does, where to run it, the exact command, what success looks like, common errors, how to verify. One step at a time.
- Budget 0 THB: free tiers only. Warn me before anything that could cost money.
- Never guess facts (versions, prices, quotas, API behavior, licenses). Verify, or say "ต้องเช็กก่อน".
- Discuss design and decisions with me first; build only after I agree.

## Product
Thongyod (working title): a mobile-first PWA for Thai university students (Gen Z, and Gen Alpha who reached university; not for minors). Friends plan meetups through LINE links, vote on time and restaurant, split bills with PromptPay QR, and raise a cute virtual pet (Maew Gon, a chubby round cat, 3D with React Three Fiber) that grows with the group's real activity. Fun extras: titles (ฉายา) from shared gang data, controllable teasing, Saimu (lucky colors, "for entertainment"). UI in Thai (default) and English.

v1 in one sentence: share a link in a LINE group → vote on restaurant and time → go eat → split the bill with a PromptPay QR → each pet gets a souvenir.

Roadmap: M0 setup (done) · M1 LINE Login, gangs, friends, invites · M2 meetups · M3 restaurant randomizer (user-pinned places only) + voting room · M4 bill split + PromptPay QR · M5 pet (blind box, room, moods) · M6 titles · M7 daily lucky color · M8 Google Places. Later: timetable, grades/GPAX, focus timer, flashcards.

## Product rules
- Notify rarely: max 3 per day, quiet hours 22:00-08:00, no pet push notifications, sound off by default.
- The pet never dies; no penalties; cute moods when the user is away.
- Money, dates, bills and grades use deterministic code (money = integer satang) with tests. No AI features and no real payment processing in v1.
- Privacy: birthday and gender are owner-only; gang data only for members; invite links never reveal content by themselves.
- Principle: fast, simple, not annoying (common tasks in 3 taps or fewer).

## Decisions so far (details in docs/DECISIONS.md; newest wins)
- Login: LINE Login only in v1. Unique display names. Avatar from LINE.
- Gangs: no leader. Any member can change settings; changes that make admission easier wait 24 h unless someone objects; every change notifies all members. Admission per gang: majority vote within 48 h (default) or auto-approve unless someone objects within 24 h; the candidate must accept. Removing a member = majority vote.
- Friends: sub-tab inside "แก๊ง". Add by exact-name search, friend link/QR (live camera scan), or from a gang member list. Requests need acceptance. Block, daily request limit, silent unfriend.
- Meetups: ไป / อาจจะ / ไม่ไป, plus "ซ่อนนัดนี้" (silent decline: hidden everywhere, not counted, no titles, must never leak through totals). Answers lock 10 min after start. The creator confirms who actually came (otherwise "going" = attended after 24 h). Moving the time a lot → everyone reconfirms. Capacity → waitlist. Guests can vote via a LINE link with a nickname. The detail page shows who answered what (and who has not), with a nudge button.
- Home: week strip → "รอคุณตอบ" (answering slides the card away, 4-second undo) → agenda of the selected day. Pet card hidden until the pet is activated. Users can show/hide/reorder home cards.
- Tabs: หน้าหลัก | แก๊ง | ทำอะไรดี (center: all tools grouped with friends / solo / coming soon) | สัตว์เลี้ยง | ฉัน (Facebook-style profile, settings gear top-right).
- Quick vote (done): one phone passed around, secret ballot, tie → random / tie-break round / choose. No login.
- Themes: "ค่าเริ่มต้น" (gold/gray) and "น่ารัก" (pastel pink); dark mode follows the device. Fonts: Anuphan (+ Mali headings in the cute theme).
- Title change: "สายมูตัวพ่อ/ตัวแม่" → "สายมู".

## Tech
- Monorepo with npm workspaces. Run commands from the repo root.
  - apps/web: React 19, Vite, TypeScript strict, Tailwind CSS v4, shadcn/ui on Base UI, lucide-react, React Router 8, i18next, Vitest; TanStack Query + MSW planned.
  - apps/api: NestJS. PostgreSQL locally first; free hosting later (candidates: Koyeb or Render + Neon + Cloudflare Pages; re-verify before deploying).
  - packages/shared (@thongyod/shared): TypeScript types = the API contract.
- Node 26 (nvm-windows). Private GitHub repo: Earthkunggg/thongyod.

## Code rules
- Reuse components: check docs/COMPONENTS.md before creating one; extend with props instead of duplicating. shadcn components are copied into components/ui. Record source and license of any copied code (free licenses only).
- No UI text inside components: use i18n keys; th.ts and en.ts must have the same keys.
- The API sends data, not sentences; the frontend builds the text. Dates are ISO 8601 UTC.
- Never commit secrets; .env files stay ignored. Write tests for money, randomization and permissions.

## Team
- Claude = frontend (apps/web) and reviews the backend. Codex/ChatGPT = backend (apps/api) and reviews the frontend. Never edit the other side's folder; send requests through docs/HANDOFF.md. Nobody reviews their own work.
- Shared docs: docs/DECISIONS.md, docs/HANDOFF.md, docs/ERD.md, docs/COMPONENTS.md, docs/PROJECT_BRIEF.md.
- Review checklist: access control (changing IDs in URLs/requests), invite link leaks, private data leaks, money correctness, unexpected paid API calls, secrets, spec match, natural Thai UI, mobile/touch, 3D performance. Report each finding as severity (สูง/กลาง/ต่ำ), file and line, problem, suggested fix.

## Status (2026-11-03)
- Frontend (mock data): app shell and tabs, Home, Explore, Quick Vote, themes, Thai/English.
- Backend: NestJS with GET /health only; ERD and a draft meetup contract. Next: update the ERD for decisions #29-#37, choose ORM/migrations, LINE Login, and a dev-only login for testing several users on one PC.

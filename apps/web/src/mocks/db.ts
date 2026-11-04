// IN-MEMORY MOCK DATABASE for development (decision #37). Resets when the dev server restarts.
// Returns the V1 contract shapes from @thongyod/shared and follows the approved rules:
// - hidden members are excluded from member lists, counts and avatars (#32)
// - answers and hide/unhide lock 10 minutes after the start time (#33, #40)
// - writes need the current scheduleVersion (#40)
// Thai strings here are USER CONTENT (names, titles), not UI text.
import type { HomeSummary, MeetupMember, MeetupParticipationStatus, MeetupResponse } from '@thongyod/shared'
import type { MeetupDetailFull, MeetupListItem, PersonCard, PersonRef } from '@/api/types'

export const ME = 'u1'
const LOCK_AFTER_MS = 10 * 60_000

export type User = { id: string; name: string; handle: string; title: string | null; avatarUrl: string | null; coverUrl: string | null }
type Gang = { id: string; name: string; memberIds: string[] }
type Answer = { response: MeetupResponse | null; hidden: boolean }
type Meetup = {
  id: string
  gangId: string
  title: string
  startsAt: Date
  createdBy: string
  createdAt: Date
  scheduleVersion: number
  answers: Map<string, Answer>
}

const u = (id: string, name: string, handle: string, title: string | null = null): User => ({
  id, name, handle, title, avatarUrl: null, coverUrl: null,
})

export const users: User[] = [
  u('u1', 'เอิร์ธ', 'earth_buu', 'สายเปย์'),
  u('u2', 'ต้น', 'ton.cpe', 'ตัวตึงหมูกระทะ'),
  u('u3', 'เบียร์', 'beer.bear', 'นก'),
  u('u4', 'แอม', 'am_amm'),
  u('u5', 'พลอย', 'ploy.mu', 'สายมู'),
  u('u6', 'กาย', 'guy_gg'),
  u('u7', 'มายด์', 'mind.m'),
  u('u8', 'บอส', 'boss99', 'มาสาย'),
  u('u9', 'แบงค์', 'bank.b'),
  // Same display names as u2 / u3: handles tell them apart (decision #45).
  u('u10', 'ต้น', 'ton.math'),
  u('u11', 'เบียร์', 'beer_eng', 'สายกิน'),
  // Many friends of u1 so the friend list needs paging (decision #43).
  ...['ฟ้า', 'น้ำ', 'ปาล์ม', 'เจ', 'มิว', 'ไอซ์', 'ฝน', 'บีม', 'ตาล', 'โอ๊ต', 'แพร', 'เก่ง', 'นิว', 'ปุ้ย', 'ออม', 'จูน', 'เต้', 'แนน', 'กิ๊ฟ', 'เฟิร์ส', 'ปอ', 'มุก', 'โฟม', 'เอ็ม', 'ภูมิ'].map(
    (name, i) => u(`u${20 + i}`, name, `friend${String(i + 1).padStart(2, '0')}`),
  ),
]

export const gangs: Gang[] = [
  { id: 'g1', name: 'แก๊งคอม 66', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u10'] },
  { id: 'g2', name: 'ทีมแบดวันพุธ', memberIds: ['u1', 'u2', 'u7', 'u8'] },
  { id: 'g3', name: 'เพื่อนมัธยม', memberIds: ['u1', 'u3', 'u5', 'u8'] },
]

function dayAt(daysFromToday: number, hours: number, minutes = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function answers(entries: [string, MeetupResponse | null, boolean?][]): Map<string, Answer> {
  return new Map(entries.map(([id, response, hidden]) => [id, { response, hidden: hidden ?? false }]))
}

// If it is already evening, "tonight" meetups move to tomorrow so they stay upcoming.
const late = new Date().getHours() >= 17
const meetups: Meetup[] = [
  {
    id: 'm1', gangId: 'g1', title: 'หมูกระทะหลังสอบ', startsAt: dayAt(late ? 1 : 0, 18), createdBy: 'u2', createdAt: dayAt(-1, 12), scheduleVersion: 1,
    // u6 hid this meetup: must not appear anywhere for others.
    answers: answers([['u2', 'going'], ['u3', 'going'], ['u4', 'maybe'], ['u5', 'not_going'], ['u6', null, true]]),
  },
  {
    id: 'm2', gangId: 'g2', title: 'แบดเย็นพุธ', startsAt: dayAt(late ? 2 : 1, 17, 30), createdBy: 'u2', createdAt: dayAt(-2, 9), scheduleVersion: 1,
    answers: answers([['u2', 'going'], ['u7', 'going'], ['u8', 'maybe']]),
  },
  {
    id: 'm3', gangId: 'g1', title: 'ติวสอบ DB', startsAt: dayAt(late ? 1 : 0, 20, 30), createdBy: 'u1', createdAt: dayAt(-1, 8), scheduleVersion: 1,
    answers: answers([['u1', 'going'], ['u3', 'going'], ['u4', 'going']]),
  },
  {
    id: 'm4', gangId: 'g3', title: 'ข้าวมันไก่หน้ามอ', startsAt: dayAt(3, 12), createdBy: 'u3', createdAt: dayAt(-3, 20), scheduleVersion: 1,
    answers: answers([['u1', 'going'], ['u3', 'going'], ['u5', 'maybe']]),
  },
  {
    // Started 2 hours ago: answers are locked.
    id: 'm5', gangId: 'g1', title: 'กินข้าวกลางวันโรงอาหาร', startsAt: new Date(Date.now() - 2 * 3_600_000), createdBy: 'u4',
    createdAt: dayAt(-1, 9), scheduleVersion: 1,
    answers: answers([['u4', 'going'], ['u2', 'going'], ['u6', 'not_going']]),
  },
  {
    // I hid this one: it must not appear on Home.
    id: 'm6', gangId: 'g2', title: 'แบดเสาร์เช้า', startsAt: dayAt(4, 8), createdBy: 'u7', createdAt: dayAt(-1, 21), scheduleVersion: 1,
    answers: answers([['u7', 'going'], ['u1', null, true]]),
  },
]

export const userById = (id: string) => users.find((x) => x.id === id)
export const person = (id: string): PersonRef => ({
  userId: id,
  displayName: userById(id)?.name ?? '?',
  avatarUrl: userById(id)?.avatarUrl ?? null,
})
export const personCard = (id: string): PersonCard => ({ ...person(id), handle: userById(id)?.handle ?? '' })
const gangOf = (m: Meetup) => gangs.find((g) => g.id === m.gangId)!
const answerOf = (m: Meetup, userId: string): Answer => m.answers.get(userId) ?? { response: null, hidden: false }

function counts(m: Meetup) {
  const c = { going: 0, maybe: 0, not_going: 0 }
  m.answers.forEach((a) => {
    if (!a.hidden && a.response) c[a.response] += 1
  })
  return c
}

const statusOf = (a: Answer): MeetupParticipationStatus => a.response ?? 'unanswered'
const lockAt = (m: Meetup) => new Date(m.startsAt.getTime() + LOCK_AFTER_MS)
const isLocked = (m: Meetup) => Date.now() >= lockAt(m).getTime()

function toListItem(m: Meetup): MeetupListItem {
  const going = gangOf(m).memberIds.filter((id) => !answerOf(m, id).hidden && answerOf(m, id).response === 'going')
  const mine = answerOf(m, ME)
  return {
    id: m.id,
    title: m.title,
    gangId: m.gangId,
    gangName: gangOf(m).name,
    startsAt: m.startsAt.toISOString(),
    counts: counts(m),
    myResponse: mine.response,
    createdBy: person(m.createdBy),
    myState: { hidden: mine.hidden, needsReconfirm: false, status: statusOf(mine), waitlistPosition: null },
    goingAvatars: going.slice(0, 3).map((id) => ({ participantId: `p-${m.id}-${id}`, displayName: person(id).displayName, avatarUrl: null })),
    responseLocksAt: lockAt(m).toISOString(),
    scheduleVersion: m.scheduleVersion,
  }
}

function toDetail(m: Meetup): MeetupDetailFull {
  // Other people who hid it are left out; only my own row may appear while I am hidden.
  const members: MeetupMember[] = gangOf(m)
    .memberIds.filter((id) => id === ME || !answerOf(m, id).hidden)
    .map((id) => ({
      participantId: `p-${m.id}-${id}`,
      displayName: person(id).displayName,
      avatarUrl: null,
      response: answerOf(m, id).response,
      status: statusOf(answerOf(m, id)),
      isGuest: false,
      userId: id,
    }))
  return {
    ...toListItem(m),
    createdAt: m.createdAt.toISOString(),
    members,
    minPeople: null,
    maxPeople: null,
    waitlistedCount: 0,
    needsReconfirmCount: 0,
    attendance: {
      confirmationOpensAt: lockAt(m).toISOString(),
      confirmationDueAt: new Date(m.startsAt.getTime() + 24 * 3_600_000).toISOString(),
      finalizedAt: null,
      finalizedBy: null,
      entries: [],
    },
  }
}

const visibleToMe = (m: Meetup) => gangOf(m).memberIds.includes(ME)

export type Visibility = 'visible' | 'hidden' | 'all'

export function listMeetups(from: Date, to: Date, visibility: Visibility): MeetupListItem[] {
  return meetups
    .filter((m) => visibleToMe(m) && m.startsAt >= from && m.startsAt < to)
    .filter((m) => visibility === 'all' || answerOf(m, ME).hidden === (visibility === 'hidden'))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.id.localeCompare(b.id))
    .map(toListItem)
}

export function getMeetup(id: string): MeetupDetailFull | null {
  const m = meetups.find((x) => x.id === id)
  return m && visibleToMe(m) ? toDetail(m) : null
}

export type MutationResult = { ok: true; meetup: MeetupDetailFull } | { ok: false; status: number; code: string }

function mutate(id: string, change: (m: Meetup) => MutationResult | null): MutationResult {
  const m = meetups.find((x) => x.id === id)
  if (!m || !visibleToMe(m)) return { ok: false, status: 404, code: 'MEETUP_NOT_FOUND' }
  return change(m) ?? { ok: true, meetup: toDetail(m) }
}

export function setResponse(id: string, response: MeetupResponse | null, scheduleVersion: number): MutationResult {
  return mutate(id, (m) => {
    if (scheduleVersion !== m.scheduleVersion) return { ok: false, status: 409, code: 'MEETUP_VERSION_CONFLICT' }
    if (isLocked(m)) return { ok: false, status: 409, code: 'RESPONSE_LOCKED' }
    m.answers.set(ME, { ...answerOf(m, ME), response })
    return null
  })
}

export function setHidden(id: string, hidden: boolean): MutationResult {
  return mutate(id, (m) => {
    if (hidden && m.createdBy === ME) return { ok: false, status: 409, code: 'CREATOR_CANNOT_HIDE' }
    if (isLocked(m)) return { ok: false, status: 409, code: 'RESPONSE_LOCKED' }
    // Unhide → unanswered (decision #40).
    m.answers.set(ME, hidden ? { ...answerOf(m, ME), hidden: true } : { response: null, hidden: false })
    return null
  })
}

/** Title limit (proposal for the backend): 1-60 characters after trim. */
const TITLE_MAX = 60
/** How far ahead a meetup may start (proposal). */
const MAX_AHEAD_MS = 365 * 24 * 3_600_000
let nextMeetupId = 100

export function listMyGangs(q = '') {
  const needle = q.trim().toLowerCase()
  return gangs
    .filter((g) => g.memberIds.includes(ME) && g.name.toLowerCase().includes(needle))
    .map((g) => ({ id: g.id, name: g.name, memberCount: g.memberIds.length }))
}

/** Gangs both I and `otherId` are in (#44: never reveal other gangs). */
export function sharedGangs(otherId: string) {
  return gangs.filter((g) => g.memberIds.includes(ME) && g.memberIds.includes(otherId)).map((g) => ({ id: g.id, name: g.name }))
}

/** Upcoming meetups where both answered going and neither hid it (max 5). */
export function upcomingTogether(otherId: string): MeetupListItem[] {
  const now = Date.now()
  return meetups
    .filter((m) => visibleToMe(m) && gangOf(m).memberIds.includes(otherId) && m.startsAt.getTime() > now)
    .filter((m) => [ME, otherId].every((id) => answerOf(m, id).response === 'going' && !answerOf(m, id).hidden))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 5)
    .map(toListItem)
}

export function createMeetup(body: { gangId: string; title: string; startsAt: string }): MutationResult | { ok: false; status: number; code: string; field: string } {
  const gang = gangs.find((g) => g.id === body.gangId)
  if (!gang || !gang.memberIds.includes(ME)) return { ok: false, status: 404, code: 'GANG_NOT_FOUND', field: 'gangId' }
  const title = body.title.trim()
  if ([...title].length < 1 || [...title].length > TITLE_MAX) return { ok: false, status: 400, code: 'INVALID_REQUEST', field: 'title' }
  const startsAt = new Date(body.startsAt)
  if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now() || startsAt.getTime() - Date.now() > MAX_AHEAD_MS) {
    return { ok: false, status: 400, code: 'INVALID_REQUEST', field: 'startsAt' }
  }
  const meetup: Meetup = {
    id: `m${nextMeetupId++}`,
    gangId: gang.id,
    title,
    startsAt,
    createdBy: ME,
    createdAt: new Date(),
    scheduleVersion: 1,
    answers: answers([[ME, 'going']]), // creator counts as going
  }
  meetups.push(meetup)
  return { ok: true, meetup: toDetail(meetup) }
}

export function getHome(): HomeSummary {
  const now = Date.now()
  return {
    pending: [
      { id: 'p1', kind: 'vote_time', gangName: 'ทีมแบดวันพุธ', subject: 'แบดเย็นพุธ', dueAt: dayAt(0, 22).toISOString() },
      { id: 'p2', kind: 'pay_bill', gangName: 'แก๊งคอม 66', subject: 'บิลชาบู', counterpartName: 'แอม', amountSatang: 18600 },
    ],
    pet: null, // not activated yet: the pet card stays hidden (#35)
    luckyColor: 'pink',
    feed: [
      { id: 'f1', kind: 'meetup_created', actorName: 'ต้น', subject: 'แบดเย็นพุธ', gangName: 'ทีมแบดวันพุธ', createdAt: new Date(now - 20 * 60_000).toISOString() },
      { id: 'f2', kind: 'title_earned', actorName: 'เบียร์', subject: 'นก', gangName: 'เพื่อนมัธยม', createdAt: new Date(now - 2 * 3_600_000).toISOString() },
    ],
  }
}

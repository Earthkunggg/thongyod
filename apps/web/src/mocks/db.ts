// IN-MEMORY MOCK DATABASE for development (decision #37). Resets on page reload.
// Follows the approved rules so the UI behaves like the real API:
// - hidden members are excluded from member lists and all counts (#32)
// - answers lock 10 minutes after the start time (#33)
// Thai strings here are USER CONTENT (names, titles), not UI text.
import type { HomeSummary, MeetupResponse } from '@thongyod/shared'
import type { MeetupDetailFull, MeetupListItem, MeetupMember, PersonRef } from '@/api/types'

export const ME = 'u1'
const LOCK_AFTER_MS = 10 * 60_000

type User = { id: string; name: string }
type Gang = { id: string; name: string; memberIds: string[] }
type Answer = { response: MeetupResponse | null; hidden: boolean }
type Meetup = { id: string; gangId: string; title: string; startsAt: Date; createdBy: string; createdAt: Date; answers: Map<string, Answer> }

const users: User[] = [
  { id: 'u1', name: 'เอิร์ธ' },
  { id: 'u2', name: 'ต้น' },
  { id: 'u3', name: 'เบียร์' },
  { id: 'u4', name: 'แอม' },
  { id: 'u5', name: 'พลอย' },
  { id: 'u6', name: 'กาย' },
  { id: 'u7', name: 'มายด์' },
  { id: 'u8', name: 'บอส' },
]

const gangs: Gang[] = [
  { id: 'g1', name: 'แก๊งคอม 66', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'] },
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
    id: 'm1', gangId: 'g1', title: 'หมูกระทะหลังสอบ', startsAt: dayAt(late ? 1 : 0, 18), createdBy: 'u2', createdAt: dayAt(-1, 12),
    // u6 hid this meetup: must not appear anywhere for others.
    answers: answers([['u2', 'going'], ['u3', 'going'], ['u4', 'maybe'], ['u5', 'not_going'], ['u6', null, true]]),
  },
  {
    id: 'm2', gangId: 'g2', title: 'แบดเย็นพุธ', startsAt: dayAt(late ? 2 : 1, 17, 30), createdBy: 'u2', createdAt: dayAt(-2, 9),
    answers: answers([['u2', 'going'], ['u7', 'going'], ['u8', 'maybe']]),
  },
  {
    id: 'm3', gangId: 'g1', title: 'ติวสอบ DB', startsAt: dayAt(late ? 1 : 0, 20, 30), createdBy: 'u1', createdAt: dayAt(-1, 8),
    answers: answers([['u1', 'going'], ['u3', 'going'], ['u4', 'going']]),
  },
  {
    id: 'm4', gangId: 'g3', title: 'ข้าวมันไก่หน้ามอ', startsAt: dayAt(3, 12), createdBy: 'u3', createdAt: dayAt(-3, 20),
    answers: answers([['u1', 'going'], ['u3', 'going'], ['u5', 'maybe']]),
  },
]

const person = (id: string): PersonRef => ({ userId: id, displayName: users.find((u) => u.id === id)?.name ?? '?', avatarUrl: null })
const gangOf = (m: Meetup) => gangs.find((g) => g.id === m.gangId)!
const answerOf = (m: Meetup, userId: string): Answer => m.answers.get(userId) ?? { response: null, hidden: false }

function counts(m: Meetup) {
  const c = { going: 0, maybe: 0, not_going: 0 }
  m.answers.forEach((a) => {
    if (!a.hidden && a.response) c[a.response] += 1
  })
  return c
}

function toListItem(m: Meetup): MeetupListItem {
  const going = gangOf(m).memberIds.filter((id) => !answerOf(m, id).hidden && answerOf(m, id).response === 'going')
  return {
    id: m.id,
    title: m.title,
    gangId: m.gangId,
    gangName: gangOf(m).name,
    startsAt: m.startsAt.toISOString(),
    counts: counts(m),
    myResponse: answerOf(m, ME).response,
    myHidden: answerOf(m, ME).hidden,
    createdBy: person(m.createdBy),
    createdByMe: m.createdBy === ME,
    goingPreview: going.slice(0, 3).map(person),
  }
}

function toDetail(m: Meetup): MeetupDetailFull {
  const members: MeetupMember[] = gangOf(m)
    .memberIds.filter((id) => id === ME || !answerOf(m, id).hidden)
    .map((id) => ({ ...person(id), response: answerOf(m, id).response, isGuest: false, isMe: id === ME }))
  return {
    ...toListItem(m),
    createdAt: m.createdAt.toISOString(),
    answersLockAt: new Date(m.startsAt.getTime() + LOCK_AFTER_MS).toISOString(),
    members,
  }
}

const visibleToMe = (m: Meetup) => gangOf(m).memberIds.includes(ME)

export function listMeetups(from: Date, to: Date, includeHidden: boolean): MeetupListItem[] {
  return meetups
    .filter((m) => visibleToMe(m) && m.startsAt >= from && m.startsAt < to)
    .filter((m) => includeHidden || !answerOf(m, ME).hidden)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
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

export function setResponse(id: string, response: MeetupResponse | null): MutationResult {
  return mutate(id, (m) => {
    if (Date.now() > m.startsAt.getTime() + LOCK_AFTER_MS) return { ok: false, status: 409, code: 'ANSWERS_LOCKED' }
    m.answers.set(ME, { ...answerOf(m, ME), response })
    return null
  })
}

export function setHidden(id: string, hidden: boolean): MutationResult {
  return mutate(id, (m) => {
    if (hidden && m.createdBy === ME) return { ok: false, status: 400, code: 'CANNOT_HIDE_OWN_MEETUP' }
    m.answers.set(ME, { ...answerOf(m, ME), hidden })
    return null
  })
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

// MOCK DATA for the Home page until the backend exists (decision #5).
// Times are relative to `now` so the page always looks realistic.
// Thai strings here are USER CONTENT (names, titles), not UI text, so they are not translated.
import type { HomeSummary, MeetupSummary } from '@thongyod/shared'
import { addDays, startOfDay } from '@/lib/date'

function at(day: Date, hours: number, minutes = 0): string {
  const d = new Date(day)
  d.setHours(hours, minutes, 0, 0)
  return d.toISOString()
}

export function getHomeMock(now: Date = new Date()): HomeSummary {
  const today = startOfDay(now)
  // If it is already late, put the "tonight" meetup on tomorrow instead.
  const firstDay = now.getHours() < 17 ? today : addDays(today, 1)

  const weekMeetups: MeetupSummary[] = [
    {
      id: 'm1',
      title: 'หมูกระทะหลังสอบ',
      gangId: 'g1',
      gangName: 'แก๊งคอม 66',
      startsAt: at(firstDay, 18),
      counts: { going: 5, maybe: 2, not_going: 1 },
      myResponse: null,
    },
    {
      id: 'm2',
      title: 'แบดเย็นพุธ',
      gangId: 'g2',
      gangName: 'ทีมแบดวันพุธ',
      startsAt: at(addDays(firstDay, 1), 17, 30),
      counts: { going: 6, maybe: 0, not_going: 0 },
      myResponse: 'going',
    },
    {
      id: 'm3',
      title: 'ข้าวมันไก่หน้ามอ',
      gangId: 'g3',
      gangName: 'เพื่อนมัธยม',
      startsAt: at(addDays(firstDay, 3), 12),
      counts: { going: 3, maybe: 1, not_going: 0 },
      myResponse: 'maybe',
    },
  ]

  return {
    weekMeetups,
    nextMeetup: weekMeetups[0],
    pending: [
      { id: 'p1', kind: 'vote_time', gangName: 'ทีมแบดวันพุธ', subject: 'แบดเย็นพุธ', dueAt: at(today, 22) },
      { id: 'p2', kind: 'pay_bill', gangName: 'แก๊งคอม 66', subject: 'บิลชาบู', counterpartName: 'แอม', amountSatang: 18600 },
    ],
    pet: { name: null, mood: 'sulking' },
    luckyColor: 'pink',
    feed: [
      { id: 'f1', kind: 'meetup_created', actorName: 'ต้น', subject: 'แบดเย็นพุธ', gangName: 'ทีมแบดวันพุธ', createdAt: new Date(now.getTime() - 20 * 60_000).toISOString() },
      { id: 'f2', kind: 'title_earned', actorName: 'เบียร์', subject: 'นก', gangName: 'เพื่อนมัธยม', createdAt: new Date(now.getTime() - 2 * 3_600_000).toISOString() },
    ],
  }
}

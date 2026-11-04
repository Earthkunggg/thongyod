// In-memory notifications for the mock API (provisional contract in api/types.ts).
// Thai strings are USER CONTENT (meetup titles, bill names, titles), not UI text.
import type { AppNotification, NotificationPage } from '@/api/types'
import { person } from './db'
import { page } from './friends'

const now = Date.now()
const ago = (min: number) => new Date(now - min * 60_000).toISOString()
const at = (daysFromToday: number, h: number, m = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function n(id: string, minutesAgo: number, read: boolean, rest: Partial<AppNotification> & Pick<AppNotification, 'kind' | 'target'>): AppNotification {
  return { id, createdAt: ago(minutesAgo), readAt: read ? ago(minutesAgo - 1) : null, actor: null, gangName: null, subject: null, startsAt: null, amountSatang: null, ...rest }
}

let items: AppNotification[] = [
  n('n1', 5, false, { kind: 'meetup_invite', actor: person('u2'), gangName: 'ทีมแบดวันพุธ', subject: 'แบดเย็นพุธ', target: { type: 'meetup', id: 'm2' } }),
  n('n2', 40, false, { kind: 'meetup_time_changed', actor: person('u3'), gangName: 'เพื่อนมัธยม', subject: 'ข้าวมันไก่หน้ามอ', startsAt: at(3, 12, 30), target: { type: 'meetup', id: 'm4' } }),
  n('n3', 90, false, { kind: 'friend_request', actor: person('u9'), target: { type: 'friend_requests' } }),
  n('n4', 180, false, { kind: 'bill_reminder', actor: person('u4'), gangName: 'แก๊งคอม 66', subject: 'บิลชาบู', amountSatang: 18600, target: null }),
  n('n5', 300, true, { kind: 'meetup_reminder', gangName: 'แก๊งคอม 66', subject: 'ติวสอบ DB', startsAt: at(0, 20, 30), target: { type: 'meetup', id: 'm3' } }),
  n('n6', 600, true, { kind: 'title_earned', actor: person('u5'), gangName: 'แก๊งคอม 66', subject: 'สายมู', target: { type: 'gang', id: 'g1' } }),
  n('n7', 1300, true, { kind: 'friend_accepted', actor: person('u7'), target: { type: 'user', id: 'u7' } }),
  n('n8', 1500, true, { kind: 'meetup_cancelled', actor: person('u8'), gangName: 'ทีมแบดวันพุธ', subject: 'แบดเช้าวันอาทิตย์', target: null }),
  n('n9', 2000, true, { kind: 'gang_settings_changed', actor: person('u6'), gangName: 'แก๊งคอม 66', target: { type: 'gang', id: 'g1' } }),
  // Older ones so the list needs a second page.
  ...Array.from({ length: 22 }, (_, i) =>
    n(`n${20 + i}`, 3000 + i * 700, true, {
      kind: i % 2 ? 'meetup_invite' : 'title_earned',
      actor: person(`u${20 + (i % 10)}`),
      gangName: 'ชมรมถ่ายภาพ',
      subject: i % 2 ? 'ถ่ายรูปตลาดนัด' : 'ช่างภาพประจำแก๊ง',
      target: i % 2 ? null : { type: 'gang', id: 'g4' },
    }),
  ),
]

export function listNotifications(cursor: string | null, limit: number): NotificationPage {
  return { ...page(items, cursor, limit), unreadCount: items.filter((x) => !x.readAt).length }
}

/** ids = these (unknown ids are ignored); undefined = all. */
export function markRead(ids: string[] | undefined): void {
  const stamp = new Date().toISOString()
  items = items.map((x) => (x.readAt || (ids && !ids.includes(x.id)) ? x : { ...x, readAt: stamp }))
}

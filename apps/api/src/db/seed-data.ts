import { createHash } from 'node:crypto'

export const SEED_VERSION = 1
export const fixtureKeys = ['earth', 'ton', 'beer', 'aom', 'ploy', 'mint', 'fern', 'bam', 'nam', 'fah', 'bow', 'may', 'ann', 'ice', 'new', 'bank', 'boss', 'game', 'golf', 'james', 'joe', 'kong', 'mark', 'max', 'mix', 'mook', 'nan', 'nice', 'nut', 'oil', 'pan', 'peach', 'pim', 'ping', 'pond', 'praew', 'pun', 'sky', 'view', 'win']
const names = ['เอิร์ธ', 'ต้น', 'เบียร์', 'ออม', 'พลอย', 'มิ้นท์', 'เฟิร์น', 'แบม', 'น้ำ', 'ฟ้า', 'โบว์', 'เมย์', 'แอน', 'ไอซ์', 'นิว', 'แบงค์', 'บอส', 'เกมส์', 'กอล์ฟ', 'เจมส์', 'โจ', 'ก้อง', 'มาร์ค', 'แม็กซ์', 'มิกซ์', 'มุก', 'แนน', 'ไนซ์', 'นัท', 'ออย', 'ปัน', 'พีช', 'พิม', 'ปิง', 'ปอนด์', 'แพรว', 'ปุณ', 'สกาย', 'วิว', 'วิน']
export const gangNames = ['แก๊งคอม 66', 'ทีมแบดวันพุธ', 'เพื่อนมัธยม', 'สายกินหลังเรียน', 'ทีมโปรเจกต์', 'ชมรมบอร์ดเกม', 'สายวิ่งเช้า', 'กลุ่มอ่านหนังสือ']
export const gangSizes = [25, 18, 12, 8, 6, 5, 4, 3]
export function fixtureId(kind: string, key: string | number): string {
  const hex = createHash('sha256').update(`thongyod-v1:${kind}:${key}`).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
export function hashToken(token: string): string { return createHash('sha256').update(token).digest('hex') }
export function friendFixtureToken(key: string): string { return `local-fixture-friend-${key}-v1` }

export function createSeedData(anchor: Date) {
  if (!Number.isFinite(anchor.getTime())) throw new Error('Invalid seed anchor')
  let randomState = 20261103
  const random = (max: number) => {
    randomState = (Math.imul(1664525, randomState) + 1013904223) >>> 0
    return randomState % max
  }
  const at = (days: number, hour: number, minute = 0) => {
    const local = new Date(anchor.getTime() + 7 * 3600_000)
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + days, hour - 7, minute))
  }
  const users = fixtureKeys.map((key, i) => ({
    id: fixtureId('user', key), fixtureKey: key, displayName: names[i],
    displayNameKey: names[i].normalize('NFC').toLowerCase(), avatarUrl: null,
    birthDate: i % 3 === 0 ? `2003-${String(i % 12 + 1).padStart(2, '0')}-15` : null,
    gender: (['unspecified', 'male', 'female', 'other'] as const)[i % 4],
    bio: i % 2 === 0 ? 'ชอบนัดเพื่อนและลองร้านใหม่' : null,
    mainTitleKey: i % 4 === 0 ? ['สายมู', 'นก', 'สายเปย์'][Math.floor(i / 4) % 3] : null,
    createdAt: at(-90, 9),
  }))
  const memberIndexes = gangSizes.map((size, g) => {
    const members = g < 5 ? [0] : []
    for (let offset = 0; members.length < size; offset++) {
      const candidate = ((g * 5 + offset) % 39) + 1
      if (!members.includes(candidate)) members.push(candidate)
    }
    return members
  })
  const gangs = gangNames.map((_, g) => ({ id: fixtureId('gang', g), createdBy: users[memberIndexes[g][0]].id, createdAt: at(-80, 9) }))
  const settings = gangs.map((gang, g) => ({ gangId: gang.id, name: gangNames[g], harshTitlesEnabled: g % 2 === 0, admissionRule: 'majority_48h' as const, version: 1, updatedAt: at(-80, 9) }))
  const memberships = gangs.flatMap((gang, g) => memberIndexes[g].map((u) => ({ id: fixtureId('membership', `${g}:${u}`), gangId: gang.id, userId: users[u].id, joinedAt: at(-80, 10), leftAt: null })))
  const notable = ['นัดวันนี้ช่วงเช้า', 'กินข้าวเย็นวันนี้', 'แบดพรุ่งนี้เช้า', 'คาเฟ่พรุ่งนี้บ่าย', 'นัดที่เอิร์ธซ่อนไว้', 'นัดล็อกคำตอบแล้ว', 'เอิร์ธชวนกินชาบู', 'นัดรอเอิร์ธตอบ']
  const notableTimes = [at(0, 9), at(0, 19), at(1, 10), at(1, 14), at(1, 18), new Date(anchor.getTime() - 20 * 60_000), at(2, 18), at(3, 17)]
  const meetups = Array.from({ length: 150 }, (_, m) => {
    const g = m < 8 ? m % 5 : m % 8
    const day = m === 148 ? -60 : m === 149 ? 30 : random(91) - 60
    return { id: fixtureId('meetup', m), gangId: gangs[g].id,
      createdBy: m === 6 ? users[0].id : users[memberIndexes[g].find(u => u !== 0)!].id,
      title: notable[m] ?? `${['กินข้าว', 'ตีแบด', 'อ่านหนังสือ', 'เล่นบอร์ดเกม', 'คาเฟ่'][m % 5]} ครั้งที่ ${m + 1}`,
      startsAt: notableTimes[m] ?? at(day, 8 + random(13), random(4) * 15),
      timezone: 'Asia/Bangkok', scheduleVersion: 1, createdAt: at(-70, 8),
    }
  })
  const earthStates = ['going', 'going', 'maybe', 'not_going', 'hidden', 'going', 'unanswered', 'unanswered']
  const responses = meetups.flatMap((meetup, m) => {
    const g = m < 8 ? m % 5 : m % 8
    return memberIndexes[g].flatMap((u) => {
      const state = u === 0 && m < 8 ? earthStates[m] : ['going', 'maybe', 'not_going', 'unanswered', 'hidden'][random(5)]
      if (state === 'unanswered') return []
      const hidden = state === 'hidden' && users[u].id !== meetup.createdBy
      const answer = state === 'hidden' ? null : state as 'going' | 'maybe' | 'not_going'
      const answeredAt = new Date(Math.min(anchor.getTime(), meetup.startsAt.getTime()) - 3600_000)
      return [{ id: fixtureId('response', `${m}:${u}`), meetupId: meetup.id, userId: users[u].id,
        response: answer, hiddenAt: hidden ? answeredAt : null, confirmedScheduleVersion: 1, answeredAt: answer ? answeredAt : null }]
    })
  })
  // Earth's requests/blocks reserve users 1..7; accepted pairs never overlap them.
  const acceptedPairs: [number, number][] = []
  for (let a = 0; a < 40; a++) {
    for (let b = a + 1; b < 40; b++) {
      if (a === 0 && b <= 7) continue
      acceptedPairs.push([a, b])
    }
  }
  for (let i = acceptedPairs.length - 1; i > 0; i--) {
    const j = random(i + 1)
    ;[acceptedPairs[i], acceptedPairs[j]] = [acceptedPairs[j], acceptedPairs[i]]
  }
  const friendships = acceptedPairs.slice(0, 200).map(([a, b], i) => ({
    id: fixtureId('friendship', i), requesterId: users[a].id, recipientId: users[b].id,
    status: 'accepted' as 'accepted' | 'pending', createdAt: at(-20, 9), respondedAt: at(-19, 9) as Date | null,
  }))
  for (let i = 1; i <= 5; i++) friendships.push({ id: fixtureId('friendship-request', i),
    requesterId: users[i <= 3 ? i : 0].id, recipientId: users[i <= 3 ? 0 : i].id,
    status: 'pending', createdAt: at(0, 8), respondedAt: null })
  const blocks = [
    { blockerId: users[6].id, blockedId: users[0].id, createdAt: at(-2, 9) },
    { blockerId: users[0].id, blockedId: users[7].id, createdAt: at(-2, 9) },
  ]
  const links = users.slice(0, 10).map(user => ({ id: fixtureId('friend-link', user.fixtureKey), userId: user.id,
    tokenHash: hashToken(friendFixtureToken(user.fixtureKey)), createdAt: at(-3, 9), revokedAt: null }))
  const home = users.map((user, i) => ({ userId: user.id,
    pending: i === 0 ? [
      { id: 'seed-pending-vote', kind: 'vote_time', gangName: gangNames[0], subject: 'นัดกินข้าวสัปดาห์หน้า', dueAt: at(3, 20).toISOString() },
      { id: 'seed-pending-bill', kind: 'pay_bill', gangName: gangNames[0], subject: 'ชาบูรอบก่อน', counterpartName: names[1], amountSatang: 18600 },
    ] : [],
    feed: i === 0 ? [{ id: 'seed-feed-meetup', kind: 'meetup_created', actorName: names[1], subject: notable[0], gangName: gangNames[0], createdAt: at(0, 8).toISOString() }] : [],
    pet: i === 0 || i % 3 === 0 ? null : { name: `น้อง${names[i]}`, mood: 'happy' }, luckyColor: i % 3 === 0 ? null : 'pink',
  }))
  const preferences = users.map(user => ({ userId: user.id, theme: 'default', language: 'th', homeCards: [] }))
  return { users, gangs, settings, memberships, memberIndexes, meetups, responses, friendships, blocks, links, home, preferences }
}

// In-memory profile data for the dev mock API (decision #36).
import type { EarnedTitle, Me, Profile, UpdateMeRequest } from '@/api/types'
import { cardOf, friendCount } from './friends'
import { gangs, ME, person, users } from './db'

/** Same rules as the backend (decision #40). */
const NAME_PATTERN = /^[\p{Script=Thai}A-Za-z0-9 ._-]+$/u
const BIO_MAX = 80

const bios = new Map<string, string>([
  ['u1', 'ปี 4 คอมฯ ชอบหมูกระทะกับเกมบอร์ด'],
  ['u2', 'นัดได้ทุกวันยกเว้นวันจันทร์'],
  ['u5', 'ดูดวงให้ฟรี แต่ไม่รับรองผล'],
])

const titles: Record<string, EarnedTitle[]> = {
  u1: [
    { id: 't1', name: 'สายเปย์', gangName: 'แก๊งคอม 66', earnedAt: '2026-10-20T12:00:00.000Z' },
    { id: 't2', name: 'มาตรงเวลา', gangName: 'ทีมแบดวันพุธ', earnedAt: '2026-09-02T12:00:00.000Z' },
  ],
  u2: [{ id: 't3', name: 'ตัวตึงหมูกระทะ', gangName: 'แก๊งคอม 66', earnedAt: '2026-10-01T12:00:00.000Z' }],
  u3: [{ id: 't4', name: 'นก', gangName: 'เพื่อนมัธยม', earnedAt: '2026-11-03T08:00:00.000Z' }],
  u5: [{ id: 't5', name: 'สายมู', gangName: null, earnedAt: '2026-08-15T12:00:00.000Z' }],
}

/** Small stable number per user so stats look real. */
const attended = (userId: string) => (Number(userId.slice(1)) * 7) % 23

export function getMe(): Me {
  const user = users.find((u) => u.id === ME)!
  return { ...person(ME), title: user.title, bio: bios.get(ME) ?? null }
}

export function getProfile(userId: string): Profile | null {
  const card = cardOf(userId)
  if (!card) return null
  return {
    ...card,
    bio: bios.get(userId) ?? null,
    titles: titles[userId] ?? [],
    stats: {
      friends: friendCount(userId),
      gangs: gangs.filter((g) => g.memberIds.includes(userId)).length,
      meetupsAttended: attended(userId),
    },
    pet: userId === ME ? null : { name: null, mood: 'happy' },
  }
}

export type ProfileResult = { ok: true; me: Me } | { ok: false; status: number; code: string }

export function updateMe(body: UpdateMeRequest): ProfileResult {
  const user = users.find((u) => u.id === ME)!
  if (body.displayName !== undefined) {
    const name = body.displayName.trim()
    const length = [...name].length
    if (length < 2 || length > 20 || !NAME_PATTERN.test(name)) return { ok: false, status: 400, code: 'INVALID_DISPLAY_NAME' }
    if (users.some((u) => u.id !== ME && u.name.toLowerCase() === name.toLowerCase())) {
      return { ok: false, status: 409, code: 'DISPLAY_NAME_TAKEN' }
    }
    user.name = name
  }
  if (body.bio !== undefined) {
    const bio = body.bio?.trim() ?? ''
    if ([...bio].length > BIO_MAX) return { ok: false, status: 400, code: 'INVALID_BIO' }
    if (bio === '') bios.delete(ME)
    else bios.set(ME, bio)
  }
  return { ok: true, me: getMe() }
}

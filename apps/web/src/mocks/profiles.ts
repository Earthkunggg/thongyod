// In-memory profile data for the dev mock API (decisions #36, #44, #45).
import type { EarnedTitle, GangDetail, Me, Profile, UpdateMeRequest } from '@/api/types'
import { gangs, gangUpcoming, ME, person, personCard, sharedGangs, upcomingTogether, userById, users } from './db'
import { areFriends, cardOf, friendCount, friendsSince, mutualIds } from './friends'

/** Same rules as the backend (decisions #40, #45). */
const NAME_PATTERN = /^[\p{Script=Thai}A-Za-z0-9 ._-]+$/u
const HANDLE_PATTERN = /^[a-z][a-z0-9._]{3,19}$/
const BIO_MAX = 80
const HANDLE_COOLDOWN_MS = 30 * 86_400_000
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const bios = new Map<string, string>([
  ['u1', 'ปี 4 คอมฯ ชอบหมูกระทะกับเกมบอร์ด'],
  ['u2', 'นัดได้ทุกวันยกเว้นวันจันทร์'],
  ['u5', 'ดูดวงให้ฟรี แต่ไม่รับรองผล'],
])
const handleChangedAt = new Map<string, Date>()

type TitleSeed = { id: string; name: string; gangId: string | null; earnedAt: string }
const titles: Record<string, TitleSeed[]> = {
  u1: [
    { id: 't1', name: 'สายเปย์', gangId: 'g1', earnedAt: '2026-10-20T12:00:00.000Z' },
    { id: 't2', name: 'มาตรงเวลา', gangId: 'g2', earnedAt: '2026-09-02T12:00:00.000Z' },
    // More titles so the profile cuts the list and shows "ดูทั้งหมด".
    { id: 't7', name: 'เจ้าภาพ', gangId: 'g1', earnedAt: '2026-08-11T12:00:00.000Z' },
    { id: 't8', name: 'โอนไวใจถึง', gangId: 'g3', earnedAt: '2026-07-30T12:00:00.000Z' },
    { id: 't9', name: 'หนูทดลอง', gangId: 'g5', earnedAt: '2026-07-02T12:00:00.000Z' },
    { id: 't10', name: 'เส้นสายดี', gangId: 'g4', earnedAt: '2026-06-18T12:00:00.000Z' },
    { id: 't11', name: 'มือไวใจเร็ว', gangId: 'g6', earnedAt: '2026-06-01T12:00:00.000Z' },
    { id: 't12', name: 'สายมู', gangId: null, earnedAt: '2026-05-20T12:00:00.000Z' },
  ],
  u2: [
    { id: 't3', name: 'ตัวตึงหมูกระทะ', gangId: 'g1', earnedAt: '2026-10-01T12:00:00.000Z' },
    { id: 't6', name: 'ราชาแบด', gangId: 'g9-secret', earnedAt: '2026-07-01T12:00:00.000Z' },
  ],
  u3: [{ id: 't4', name: 'นก', gangId: 'g3', earnedAt: '2026-11-03T08:00:00.000Z' }],
  u5: [{ id: 't5', name: 'สายมู', gangId: null, earnedAt: '2026-08-15T12:00:00.000Z' }],
}

/** Small stable number per user so stats look real. */
const attended = (userId: string) => (Number(userId.slice(1)) * 7) % 23

export function getMe(): Me {
  const user = userById(ME)!
  const changed = handleChangedAt.get(ME)
  const changeableAt = changed && changed.getTime() + HANDLE_COOLDOWN_MS > Date.now() ? new Date(changed.getTime() + HANDLE_COOLDOWN_MS) : null
  return {
    ...personCard(ME),
    title: user.title,
    bio: bios.get(ME) ?? null,
    coverUrl: user.coverUrl,
    handleChangeableAt: changeableAt?.toISOString() ?? null,
  }
}

export function getProfile(userId: string): Profile | null {
  const card = cardOf(userId)
  if (!card) return null
  const user = userById(userId)!
  const isSelf = userId === ME
  const full = isSelf || areFriends(ME, userId)
  const myGangIds = new Set(gangs.filter((g) => g.memberIds.includes(ME)).map((g) => g.id))
  const visibleTitles: EarnedTitle[] = (titles[userId] ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    // Hide the gang name when I am not in that gang (#44).
    gangName: t.gangId && myGangIds.has(t.gangId) ? (gangs.find((g) => g.id === t.gangId)?.name ?? null) : null,
    earnedAt: t.earnedAt,
  }))
  return {
    ...card,
    coverUrl: user.coverUrl,
    mutualPreview: isSelf ? [] : mutualIds(ME, userId).slice(0, 5).map(personCard),
    sharedGangs: isSelf ? [] : sharedGangs(userId),
    bio: full ? (bios.get(userId) ?? null) : null,
    friendsSince: !isSelf && full ? (friendsSince(ME, userId)?.toISOString() ?? null) : null,
    stats: full
      ? {
          friends: friendCount(userId),
          gangs: gangs.filter((g) => g.memberIds.includes(userId)).length,
          meetupsAttended: attended(userId),
        }
      : null,
    titles: full ? visibleTitles : null,
    pet: full && !isSelf ? { name: null, mood: 'happy', species: Number(userId.slice(1)) % 2 ? 'fish' : 'dragon' } : null,
    upcomingTogether: full && !isSelf ? upcomingTogether(userId) : null,
  }
}

export type ProfileResult = { ok: true; me: Me } | { ok: false; status: number; code: string; retryAt?: string }

export function updateMe(body: UpdateMeRequest): ProfileResult {
  const user = userById(ME)!
  if (body.displayName !== undefined) {
    const name = body.displayName.trim()
    const length = [...name].length
    if (length < 2 || length > 20 || !NAME_PATTERN.test(name)) return { ok: false, status: 400, code: 'INVALID_DISPLAY_NAME' }
  }
  if (body.bio !== undefined && [...(body.bio?.trim() ?? '')].length > BIO_MAX) {
    return { ok: false, status: 400, code: 'INVALID_BIO' }
  }
  if (body.handle !== undefined) {
    const handle = body.handle.trim().toLowerCase().replace(/^@/, '')
    if (handle !== user.handle) {
      if (!HANDLE_PATTERN.test(handle)) return { ok: false, status: 400, code: 'INVALID_HANDLE' }
      const me = getMe()
      if (me.handleChangeableAt) return { ok: false, status: 429, code: 'HANDLE_CHANGE_TOO_SOON', retryAt: me.handleChangeableAt }
      if (users.some((x) => x.id !== ME && x.handle === handle)) return { ok: false, status: 409, code: 'HANDLE_TAKEN' }
      user.handle = handle
      handleChangedAt.set(ME, new Date())
    }
  }
  // Apply the rest only after every check passed (all-or-nothing).
  if (body.displayName !== undefined) user.name = body.displayName.trim()
  if (body.bio !== undefined) {
    const bio = body.bio?.trim() ?? ''
    if (bio === '') bios.delete(ME)
    else bios.set(ME, bio)
  }
  return { ok: true, me: getMe() }
}

/** Mock upload: keeps the image as a data URL in memory. The real API re-encodes and strips EXIF (#45). */
export async function setPhoto(kind: 'avatar' | 'cover', file: File | null): Promise<ProfileResult> {
  const user = userById(ME)!
  if (file === null) {
    if (kind === 'avatar') user.avatarUrl = null
    else user.coverUrl = null
    return { ok: true, me: getMe() }
  }
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, status: 413, code: 'FILE_TOO_LARGE' }
  if (!IMAGE_TYPES.includes(file.type)) return { ok: false, status: 415, code: 'UNSUPPORTED_IMAGE' }
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  const base64 = btoa(binary)
  const url = `data:${file.type};base64,${base64}`
  if (kind === 'avatar') user.avatarUrl = url
  else user.coverUrl = url
  return { ok: true, me: getMe() }
}

/** GET /gangs/:id (provisional contract in api/types.ts). null = not found or I am not a member (404). */
export function getGangDetail(gangId: string): GangDetail | null {
  const gang = gangs.find((g) => g.id === gangId)
  if (!gang || !gang.memberIds.includes(ME)) return null
  const members = gang.memberIds
    .map((id) => ({ ...personCard(id), title: userById(id)?.title ?? null }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'th') || a.userId.localeCompare(b.userId))
  const gangTitles = Object.entries(titles)
    .flatMap(([userId, list]) => list.filter((x) => x.gangId === gangId && gang.memberIds.includes(userId)).map((x) => ({ x, userId })))
    .sort((a, b) => b.x.earnedAt.localeCompare(a.x.earnedAt))
    .map(({ x, userId }) => ({ id: x.id, name: x.name, holder: person(userId), earnedAt: x.earnedAt }))
  return { id: gang.id, name: gang.name, memberCount: gang.memberIds.length, members, upcoming: gangUpcoming(gangId), titles: gangTitles }
}

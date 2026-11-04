import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Award, ChevronRight, Lock, Users } from 'lucide-react'
import type { Profile } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { AvatarStack } from '@/components/common/AvatarStack'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SeeAllLink } from '@/components/common/SeeAllLink'
import { PetCard } from '@/components/home/PetCard'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { Card } from '@/components/ui/card'
import { formatMonthYear } from '@/lib/date'
import { SHOW_BACK } from '@/lib/nav'

/** Chip sections (titles, shared gangs) show this many; the rest are behind "ดูทั้งหมด". */
const CHIP_PREVIEW = 6

type ProfileViewProps = {
  profile: Profile
  /** Buttons under the name: "แก้ไขโปรไฟล์ + QR" for me; friend actions for others. */
  actions: ReactNode
}

// Profile page body (decisions #36, #44, #45). Same view for me, friends and non-friends;
// sections appear only when the API sends them (non-friends get less).
export function ProfileView({ profile, actions }: ProfileViewProps) {
  const { t } = useTranslation()
  const isSelf = profile.relationship === 'self'
  const limited = !isSelf && profile.stats === null

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Cover: uploaded photo, or the theme color. */}
      <div className="mx-3 h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-primary/70 to-accent" aria-hidden="true">
        {profile.coverUrl && <img src={profile.coverUrl} alt="" className="size-full object-cover" />}
      </div>
      <div className="-mt-12 flex flex-col items-center gap-1 px-4 text-center">
        <Avatar name={profile.displayName} src={profile.avatarUrl} className="size-20 text-2xl ring-4 ring-background" />
        <h2 className="mt-1 text-xl font-medium">{profile.displayName}</h2>
        <p className="text-sm text-muted-foreground">@{profile.handle}</p>
        {profile.title && (
          <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{profile.title}</span>
        )}
        {profile.bio && <p className="max-w-xs text-sm">{profile.bio}</p>}
        {profile.friendsSince && (
          <p className="text-xs text-muted-foreground">
            {t('profile.friendsSince', { date: formatMonthYear(new Date(profile.friendsSince)) })}
          </p>
        )}
      </div>

      <div className="flex justify-center gap-2 px-4">{actions}</div>

      {profile.stats && (
        <Card className="mx-3 grid grid-cols-3 divide-x overflow-hidden p-0 text-center">
          {[
            { key: 'friends', value: profile.stats.friends, label: t('profile.stats.friends'), to: isSelf ? '/gangs/friends' : profile.mutualFriends > 0 ? `/u/${profile.userId}/mutual` : null },
            { key: 'gangs', value: profile.stats.gangs, label: t('profile.stats.gangs'), to: isSelf ? '/gangs' : null },
            { key: 'attended', value: profile.stats.meetupsAttended, label: t('profile.stats.attended'), to: isSelf ? '/meetups?view=past' : null },
          ].map((s) => {
            const body = (
              <>
                <span className="block text-lg font-medium tabular-nums">{s.value}</span>
                <span className="flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
                  {s.label}
                  {s.to && <ChevronRight className="size-3" aria-hidden="true" />}
                </span>
              </>
            )
            return s.to ? (
              <Link key={s.key} to={s.to} state={SHOW_BACK} className="py-3 active:bg-muted/60">
                {body}
              </Link>
            ) : (
              <div key={s.key} className="py-3">
                {body}
              </div>
            )
          })}
        </Card>
      )}

      {limited && (
        <p className="flex items-center justify-center gap-1.5 px-6 text-center text-xs text-muted-foreground">
          <Lock className="size-3.5" aria-hidden="true" />
          {t('profile.limitedHint')}
        </p>
      )}

      {profile.upcomingTogether && profile.upcomingTogether.length > 0 && (
        <section>
          <SectionHeader title={t('profile.upcomingTogether')} />
          <Card className="mx-3 px-4 py-1">
            {profile.upcomingTogether.map((m) => (
              <MeetupRow key={m.id} meetup={m} />
            ))}
          </Card>
        </section>
      )}

      {profile.sharedGangs.length > 0 && (
        <section>
          <SectionHeader
            title={t('profile.sharedGangs', { count: profile.sharedGangs.length })}
            action={profile.sharedGangs.length > CHIP_PREVIEW && <SeeAllLink to={`/u/${profile.userId}/gangs`} />}
          />
          <div className="flex flex-wrap gap-2 px-3">
            {profile.sharedGangs.slice(0, CHIP_PREVIEW).map((g) => (
              <Link key={g.id} to={`/gangs/${g.id}`} className="flex min-h-9 items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm active:opacity-70">
                <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                {g.name}
                <ChevronRight className="-mr-1 size-3.5 text-muted-foreground" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isSelf && profile.mutualFriends > 0 && (
        <section>
          <SectionHeader
            title={t('profile.mutualTitle', { count: profile.mutualFriends })}
            action={<SeeAllLink to={`/u/${profile.userId}/mutual`} />}
          />
          <Link to={`/u/${profile.userId}/mutual`} className="mx-3 flex items-center gap-3 rounded-xl border bg-card p-3 active:opacity-80">
            <AvatarStack names={profile.mutualPreview.map((p) => p.displayName)} total={profile.mutualFriends} />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {profile.mutualPreview.map((p) => p.displayName).join(', ')}
            </span>
          </Link>
        </section>
      )}

      {profile.titles && profile.titles.length > 0 && (
        <section>
          <SectionHeader
            title={t('profile.titles', { count: profile.titles.length })}
            action={profile.titles.length > CHIP_PREVIEW && <SeeAllLink to={`/u/${profile.userId}/titles`} />}
          />
          <div className="flex flex-wrap gap-2 px-3">
            {profile.titles.slice(0, CHIP_PREVIEW).map((title) => (
              <span key={title.id} className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm">
                <Award className="size-4 text-primary" aria-hidden="true" />
                {title.name}
                {title.gangName && <span className="text-xs text-muted-foreground">· {title.gangName}</span>}
              </span>
            ))}
          </div>
        </section>
      )}

      {profile.pet && (
        <section className="px-3">
          <PetCard pet={profile.pet} luckyColor={null} to={isSelf ? '/pet' : null} />
        </section>
      )}
    </div>
  )
}

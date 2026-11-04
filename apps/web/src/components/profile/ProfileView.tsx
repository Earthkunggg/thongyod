import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Award, Lock, Users } from 'lucide-react'
import type { Profile } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { AvatarStack } from '@/components/common/AvatarStack'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PetCard } from '@/components/home/PetCard'
import { MeetupRow } from '@/components/meetup/MeetupRow'
import { Card } from '@/components/ui/card'
import { formatMonthYear } from '@/lib/date'

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
        <Card className="mx-3 grid grid-cols-3 divide-x py-3 text-center">
          {[
            { key: 'friends', value: profile.stats.friends, label: t('profile.stats.friends') },
            { key: 'gangs', value: profile.stats.gangs, label: t('profile.stats.gangs') },
            { key: 'attended', value: profile.stats.meetupsAttended, label: t('profile.stats.attended') },
          ].map((s) => (
            <div key={s.key}>
              <div className="text-lg font-medium tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
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
          <SectionHeader title={t('profile.sharedGangs', { count: profile.sharedGangs.length })} />
          <div className="flex flex-wrap gap-2 px-3">
            {profile.sharedGangs.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-sm">
                <Users className="size-4 text-muted-foreground" aria-hidden="true" />
                {g.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {!isSelf && profile.mutualFriends > 0 && (
        <section>
          <SectionHeader
            title={t('profile.mutualTitle', { count: profile.mutualFriends })}
            action={
              <Link to={`/u/${profile.userId}/mutual`} className="text-xs font-medium text-primary">
                {t('profile.seeAll')}
              </Link>
            }
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
          <SectionHeader title={t('profile.titles', { count: profile.titles.length })} />
          <div className="flex flex-wrap gap-2 px-3">
            {profile.titles.map((title) => (
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

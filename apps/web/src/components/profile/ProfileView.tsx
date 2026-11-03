import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Award } from 'lucide-react'
import type { Profile } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PetCard } from '@/components/home/PetCard'
import { Card } from '@/components/ui/card'

type ProfileViewProps = {
  profile: Profile
  /** Buttons under the name: "แก้ไขโปรไฟล์ + QR" for me, the friend button for others. */
  actions: ReactNode
}

// Facebook-style profile (decision #36). Same view for my profile and a friend's profile.
export function ProfileView({ profile, actions }: ProfileViewProps) {
  const { t } = useTranslation()
  const stats = [
    { key: 'friends', value: profile.stats.friends, label: t('profile.stats.friends') },
    { key: 'gangs', value: profile.stats.gangs, label: t('profile.stats.gangs') },
    { key: 'attended', value: profile.stats.meetupsAttended, label: t('profile.stats.attended') },
  ]

  return (
    <div className="flex flex-col gap-3 pb-6">
      {/* Cover: theme color in v1 (cover upload later). */}
      <div className="mx-3 h-24 rounded-2xl bg-gradient-to-br from-primary/70 to-accent" aria-hidden="true" />
      <div className="-mt-12 flex flex-col items-center gap-1 px-4 text-center">
        <Avatar name={profile.displayName} className="size-20 text-2xl ring-4 ring-background" />
        <h2 className="mt-1 text-xl font-medium">{profile.displayName}</h2>
        {profile.title && (
          <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{profile.title}</span>
        )}
        {profile.bio && <p className="max-w-xs text-sm text-muted-foreground">{profile.bio}</p>}
        {profile.relationship !== 'self' && profile.mutualFriends > 0 && (
          <p className="text-xs text-muted-foreground">{t('friends.mutual', { count: profile.mutualFriends })}</p>
        )}
      </div>

      <div className="flex justify-center gap-2 px-4">{actions}</div>

      <Card className="mx-3 grid grid-cols-3 divide-x py-3 text-center">
        {stats.map((s) => (
          <div key={s.key}>
            <div className="text-lg font-medium tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </Card>

      {profile.titles.length > 0 && (
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
          <PetCard pet={profile.pet} luckyColor={null} to={profile.relationship === 'self' ? '/pet' : null} />
        </section>
      )}
    </div>
  )
}

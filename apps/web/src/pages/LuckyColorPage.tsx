import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, BookOpen, Handshake, Share2, Users, Wallet, type LucideIcon } from 'lucide-react'
import type { LuckyColorKey } from '@thongyod/shared'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PageHeader } from '@/components/layout/PageHeader'
import { Pet } from '@/components/pet/Pet'
import { buttonVariants } from '@/components/ui/button'
import { LUCKY_HEX } from '@/config/luckyColors'
import { markDone } from '@/features/daily/daily'
import { loadBirthDay, saveBirthDay } from '@/features/lucky-color/storage'
import { bangkokDay, colorsFor, type TaksaDay, type Topic } from '@/features/lucky-color/taksa'
import { getMyPet } from '@/features/onboarding/storage'
import { appUrl, lineShareUrl } from '@/lib/share'
import { TONE_CLASS } from '@/lib/tones'
import { cn } from '@/lib/utils'

type Mode = 'today' | 'birth'
const TOPIC_ICON: Record<Topic, LucideIcon> = { study: BookOpen, money: Wallet, helpers: Handshake, friends: Users, avoid: Ban }
const SHOWN: Topic[] = ['study', 'money', 'helpers', 'friends']
/** Calendar order for the birth-day picker (ราหู = Wednesday night). */
const WEEK: TaksaDay[] = ['sun', 'mon', 'tue', 'wed', 'wedNight', 'thu', 'fri', 'sat']

// /lucky-color — สีมงคล (spec §13, M7): today's colors from the ทักษา of today, or of my birth weekday.
// Always labelled "ดูเพื่อความบันเทิง". The birth weekday stays on this device.
export function LuckyColorPage() {
  const { t } = useTranslation()
  const now = useMemo(() => new Date(), [])
  const today = bangkokDay(now)
  const [birth, setBirth] = useState<TaksaDay | null>(loadBirthDay)
  const [mode, setMode] = useState<Mode>(() => (loadBirthDay() ? 'birth' : 'today'))
  const [species] = useState(() => getMyPet()?.species ?? 'dragon')
  const start = mode === 'birth' && birth ? birth : today
  const colors = colorsFor(start)
  useEffect(() => markDone('tool'), [])

  const shareText = [
    t('luckyColor.shareTitle', { day: t(`luckyColor.days.${start}`) }),
    ...SHOWN.map((topic) => `${t(`luckyColor.topics.${topic}.title`)}: ${t(`colors.${colors[topic]}`)}`),
    `${t('luckyColor.topics.avoid.title')}: ${t(`colors.${colors.avoid}`)}`,
    t('luckyColor.disclaimer'),
    appUrl('/lucky-color'),
  ].join('\n')

  return (
    <div className="flex flex-col gap-3 pb-10">
      <PageHeader title={t('luckyColor.title')} subtitle={t('luckyColor.disclaimer')} backTo="/explore" />

      <div className="px-3">
        <SegmentedChoice<Mode>
          label={t('luckyColor.title')}
          value={mode}
          onChange={setMode}
          options={[
            { value: 'today', label: t('luckyColor.modeToday', { day: t(`luckyColor.days.${today}`) }) },
            { value: 'birth', label: t('luckyColor.modeBirth') },
          ]}
        />
      </div>

      {mode === 'birth' && (
        <section>
          <SectionHeader title={t('luckyColor.birthTitle')} />
          <div className="flex flex-wrap gap-2 px-3" role="radiogroup" aria-label={t('luckyColor.birthTitle')}>
            {WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  role="radio"
                  aria-checked={birth === day}
                  onClick={() => {
                    setBirth(day)
                    saveBirthDay(day)
                  }}
                  className={cn('flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm', birth === day ? 'border-primary bg-primary text-primary-foreground' : 'bg-card')}
                >
                  <span className="size-3 rounded-full border" style={{ backgroundColor: LUCKY_HEX[colorsFor(day).friends] }} aria-hidden="true" />
                  {t(`luckyColor.days.${day}`)}
                </button>
            ))}
          </div>
          <p className="px-4 pt-1.5 text-xs text-muted-foreground">{t('luckyColor.birthPrivate')}</p>
        </section>
      )}

      {/* The pet stands on today's study/work color (spec: the pet wears today's color). */}
      <div className="relative mx-auto mt-2 flex size-52 items-center justify-center">
        <span className="absolute inset-4 rounded-full opacity-90" style={{ backgroundColor: LUCKY_HEX[colors.study] }} aria-hidden="true" />
        <span className="absolute inset-0 rounded-full border-8 opacity-50" style={{ borderColor: LUCKY_HEX[colors.money] }} aria-hidden="true" />
        <Pet species={species} size={150} />
      </div>
      <p className="text-center text-sm text-muted-foreground">{t('luckyColor.for', { day: t(`luckyColor.days.${start}`) })}</p>

      <div className="grid grid-cols-2 gap-2 px-3">
        {SHOWN.map((topic) => (
          <ColorCard key={topic} topic={topic} color={colors[topic]} />
        ))}
      </div>
      <div className="px-3">
        <ColorCard topic="avoid" color={colors.avoid} />
      </div>

      <div className="px-3 pt-1">
        <a href={lineShareUrl(shareText)} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}>
          <Share2 data-icon="inline-start" />
          {t('luckyColor.share')}
        </a>
      </div>
      <p className="px-6 text-center text-xs text-muted-foreground">{t('luckyColor.source')}</p>
    </div>
  )
}

function ColorCard({ topic, color }: { topic: Topic; color: LuckyColorKey }) {
  const { t } = useTranslation()
  const Icon = TOPIC_ICON[topic]
  const avoid = topic === 'avoid'
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border bg-card p-3', avoid && TONE_CLASS.neutral)}>
      <span className="relative size-12 shrink-0 rounded-xl border shadow-inner" style={{ backgroundColor: LUCKY_HEX[color] }} aria-hidden="true">
        {avoid && <Ban className="absolute inset-0 m-auto size-7 text-white mix-blend-difference" />}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Icon className="size-3.5" aria-hidden="true" />
          {t(`luckyColor.topics.${topic}.title`)}
        </span>
        <span className="block text-base font-medium">{t(`colors.${color}`)}</span>
        <span className="block text-xs text-muted-foreground">{t(`luckyColor.topics.${topic}.hint`)}</span>
      </span>
    </div>
  )
}

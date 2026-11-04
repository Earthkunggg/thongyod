import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Award, Bell, CalendarDays, Cake, Moon, PawPrint, Receipt, Sparkles, type LucideIcon } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { CATEGORIES, isPaused, pauseUntil, REMINDER_CHOICES, type NotifyCategory, type PauseChoice, type ReminderMinutes } from '@/features/notifications/prefs'
import { setNotifyPrefs, useNotifyPrefs } from '@/features/notifications/storage'
import { formatDayLabel, formatTime } from '@/lib/date'

const ICON: Record<NotifyCategory, LucideIcon> = {
  meetups: CalendarDays,
  reminders: Bell,
  bills: Receipt,
  birthdays: Cake,
  titles: Award,
  saimu: Sparkles,
}

// /settings/notifications — spec §14: notify rarely. Categories, one reminder time, quiet hours, pause all.
// Saved on this device until the server stores preferences.
export function NotificationSettingsPage() {
  const { t } = useTranslation()
  const prefs = useNotifyPrefs()
  const now = useMemo(() => new Date(), [])
  const paused = isPaused(prefs, now)
  // More than a day left = it was a week-long pause.
  const pauseChoice: PauseChoice = !paused ? 'off' : Date.parse(prefs.pausedUntil!) - now.getTime() > 86_400_000 ? 'week' : 'day'

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader title={t('notifySettings.title')} subtitle={t('notifySettings.subtitle')} backTo="/settings" />

      <section>
        <SectionHeader title={t('notifySettings.pause')} />
        <div className="flex flex-col gap-2 px-3">
          <SegmentedChoice<PauseChoice>
            label={t('notifySettings.pause')}
            value={pauseChoice}
            onChange={(choice) => setNotifyPrefs({ ...prefs, pausedUntil: pauseUntil(choice, new Date()) })}
            options={[
              { value: 'off', label: t('notifySettings.pauseOff') },
              { value: 'day', label: t('notifySettings.pauseDay') },
              { value: 'week', label: t('notifySettings.pauseWeek') },
            ]}
          />
          {paused && prefs.pausedUntil && (
            <p className="text-xs text-muted-foreground">
              {t('notifySettings.pausedUntil', { when: `${formatDayLabel(new Date(prefs.pausedUntil), now)} ${formatTime(new Date(prefs.pausedUntil))}` })}
            </p>
          )}
        </div>
      </section>

      <section>
        <SectionHeader title={t('notifySettings.what')} />
        <Card className="mx-3 px-4 py-1">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex min-h-14 items-center gap-3 py-2 [&+&]:border-t">
              <IconTile icon={ICON[c]} tone={prefs.on[c] ? 'accent' : 'neutral'} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t(`notifySettings.categories.${c}.title`)}</span>
                <span className="block text-xs text-muted-foreground">{t(`notifySettings.categories.${c}.hint`)}</span>
              </span>
              <Switch
                checked={prefs.on[c]}
                onCheckedChange={(on) => setNotifyPrefs({ ...prefs, on: { ...prefs.on, [c]: on } })}
                aria-label={t(`notifySettings.categories.${c}.title`)}
              />
            </label>
          ))}
          <div className="flex min-h-14 items-center gap-3 border-t py-2">
            <IconTile icon={PawPrint} tone="neutral" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t('notifySettings.pet')}</span>
              <span className="block text-xs text-muted-foreground">{t('notifySettings.petHint')}</span>
            </span>
          </div>
        </Card>
      </section>

      {prefs.on.reminders && (
        <section>
          <SectionHeader title={t('notifySettings.reminderWhen')} />
          <div className="px-3">
            <SegmentedChoice<`${ReminderMinutes}`>
              label={t('notifySettings.reminderWhen')}
              value={`${prefs.reminderMinutes}`}
              onChange={(minutes) => setNotifyPrefs({ ...prefs, reminderMinutes: Number(minutes) as ReminderMinutes })}
              options={REMINDER_CHOICES.map((m) => ({
                value: `${m}` as const,
                label: m < 60 ? t('notifySettings.minutesBefore', { count: m }) : t('notifySettings.hoursBefore', { count: m / 60 }),
              }))}
            />
          </div>
        </section>
      )}

      <section>
        <SectionHeader title={t('notifySettings.quiet')} />
        <Card className="mx-3 flex flex-col gap-2 p-4">
          <div className="flex items-center gap-2">
            <Moon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Input type="time" value={prefs.quietStart} onChange={(e) => e.target.value && setNotifyPrefs({ ...prefs, quietStart: e.target.value })} aria-label={t('notifySettings.quietFrom')} />
            <span className="text-sm text-muted-foreground">–</span>
            <Input type="time" value={prefs.quietEnd} onChange={(e) => e.target.value && setNotifyPrefs({ ...prefs, quietEnd: e.target.value })} aria-label={t('notifySettings.quietTo')} />
          </div>
          <p className="text-xs text-muted-foreground">{t('notifySettings.quietHint')}</p>
        </Card>
      </section>

      <p className="px-6 text-center text-xs text-muted-foreground">{t('notifySettings.footer')}</p>
    </div>
  )
}

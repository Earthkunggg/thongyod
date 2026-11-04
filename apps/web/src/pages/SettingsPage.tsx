import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, ChevronDown, ChevronUp, Lock, MessageCircle, Sparkles } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { ListRow } from '@/components/common/ListRow'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ModeChoice } from '@/components/common/ModeChoice'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { HomeSectionId } from '@/config/home'
import { moveSection, setHomeLayout, toggleSection, useHomeLayout } from '@/features/settings/homeLayout'
import { getLanguage, setLanguage, type Language } from '@/i18n'
import { getMode, getTheme, setMode, setTheme, type Mode, type Theme } from '@/lib/theme'

const SECTION_LABEL = {
  waiting: 'settings.home.waiting',
  highlights: 'settings.home.highlights',
  tools: 'settings.home.tools',
  missions: 'settings.home.missions',
  agenda: 'settings.home.agenda',
  pending: 'settings.home.pending',
  feed: 'settings.home.feed',
  discover: 'settings.home.discover',
} as const satisfies Record<HomeSectionId, string>

// /settings — opened from the gear on "ฉัน" (decision #36).
export function SettingsPage() {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const [mode, setModeState] = useState<Mode>(getMode)
  const language = getLanguage()
  const layout = useHomeLayout()

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader title={t('settings.title')} backTo="/me" />

      <section>
        <SectionHeader title={t('settings.home.title')} />
        <p className="px-4 pb-2 text-xs text-muted-foreground">{t('settings.home.hint')}</p>
        <Card className="mx-3 px-4 py-1">
          {layout.order.map((id, index) => {
            const label = t(SECTION_LABEL[id])
            const visible = !layout.hidden.includes(id)
            return (
              <ListRow
                key={id}
                title={label}
                trailing={
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('settings.home.moveUp', { name: label })}
                      disabled={index === 0}
                      onClick={() => setHomeLayout(moveSection(layout, id, -1))}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('settings.home.moveDown', { name: label })}
                      disabled={index === layout.order.length - 1}
                      onClick={() => setHomeLayout(moveSection(layout, id, 1))}
                    >
                      <ChevronDown />
                    </Button>
                    <Switch
                      checked={visible}
                      onCheckedChange={(checked) => setHomeLayout(toggleSection(layout, id, checked))}
                      aria-label={t('settings.home.show', { name: label })}
                    />
                  </>
                }
              />
            )
          })}
        </Card>
      </section>

      <section>
        <SectionHeader title={t('pages.me.theme')} />
        <div className="px-3">
          <SegmentedChoice<Theme>
            label={t('pages.me.chooseTheme')}
            value={theme}
            onChange={(next) => {
              setTheme(next)
              setThemeState(next)
            }}
            options={[
              { value: 'default', label: t('pages.me.themeDefault') },
              { value: 'cute', label: t('pages.me.themeCute') },
            ]}
          />
          <div className="mt-3">
            <ModeChoice
              value={mode}
              onChange={(next) => {
                setMode(next)
                setModeState(next)
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('pages.me.themeHint')}</p>
        </div>
      </section>

      <section>
        <SectionHeader title={t('pages.me.language')} />
        <div className="px-3">
          {/* Language names are always shown in their own language. */}
          <SegmentedChoice<Language>
            label={t('pages.me.chooseLanguage')}
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'th', label: 'ไทย' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeader title={t('settings.more')} />
        <Card className="mx-3 px-4 py-1">
          <ListRow leading={<IconTile icon={Bell} />} title={t('settings.notifications')} subtitle={t('explore.soon')} />
          <ListRow leading={<IconTile icon={Lock} />} title={t('settings.privacy')} subtitle={t('explore.soon')} />
          <ListRow leading={<IconTile icon={MessageCircle} />} title={t('settings.lineAccount')} subtitle={t('explore.soon')} />
          <ListRow leading={<IconTile icon={Sparkles} />} title={t('settings.replayWelcome')} to="/welcome" />
        </Card>
      </section>
    </div>
  )
}

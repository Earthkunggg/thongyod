import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { getLanguage, setLanguage, type Language } from '@/i18n'
import { getTheme, setTheme, type Theme } from '@/lib/theme'

export function MePage() {
  const { t } = useTranslation()
  const [theme, setThemeState] = useState<Theme>(getTheme)
  const language = getLanguage() // re-read on every render; useTranslation re-renders on change

  function chooseTheme(next: Theme) {
    setTheme(next)
    setThemeState(next)
  }

  return (
    <>
      <PageHeader title={t('pages.me.title')} subtitle={t('pages.me.subtitle')} />

      <section className="px-4 pt-2">
        <h2 className="mb-1 text-sm font-medium">{t('pages.me.theme')}</h2>
        <p className="mb-2 text-xs text-muted-foreground">{t('pages.me.themeHint')}</p>
        <SegmentedChoice<Theme>
          label={t('pages.me.chooseTheme')}
          value={theme}
          onChange={chooseTheme}
          options={[
            { value: 'default', label: t('pages.me.themeDefault') },
            { value: 'cute', label: t('pages.me.themeCute') },
          ]}
        />
      </section>

      <section className="px-4 pt-5">
        <h2 className="mb-2 text-sm font-medium">{t('pages.me.language')}</h2>
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
      </section>
    </>
  )
}

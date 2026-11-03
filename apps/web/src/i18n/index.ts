import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { th } from './locales/th'

export type Language = 'th' | 'en'

const STORAGE_KEY = 'thongyod-lang'

function savedLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'th'
  } catch {
    return 'th'
  }
}

void i18n.use(initReactI18next).init({
  resources: { th: { translation: th }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'th',
  interpolation: { escapeValue: false }, // React already escapes text
})

document.documentElement.lang = i18n.language
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
})

export function getLanguage(): Language {
  return i18n.language === 'en' ? 'en' : 'th'
}

export function setLanguage(language: Language): void {
  void i18n.changeLanguage(language)
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Storage can be blocked (private mode). The language still applies for this visit.
  }
}

/** Locale for Intl formatters. th-TH shows Buddhist Era years (พ.ศ.). */
export function intlLocale(): string {
  return getLanguage() === 'en' ? 'en-GB' : 'th-TH'
}

export default i18n

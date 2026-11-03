// Makes t('...') keys type-checked: a typo or missing key is a compile error.
import 'i18next'
import type { th } from './locales/th'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof th }
  }
}

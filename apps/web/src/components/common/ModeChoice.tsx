import { useTranslation } from 'react-i18next'
import { Moon, Smartphone, Sun } from 'lucide-react'
import type { Mode } from '@/lib/theme'
import { SegmentedChoice } from './SegmentedChoice'

// Light / dark / follow the device. Used in Settings and the first-run theme step.
export function ModeChoice({ value, onChange }: { value: Mode; onChange: (mode: Mode) => void }) {
  const { t } = useTranslation()
  return (
    <SegmentedChoice<Mode>
      label={t('pages.me.chooseMode')}
      value={value}
      onChange={onChange}
      options={[
        { value: 'system', label: t('pages.me.modeSystem'), icon: Smartphone },
        { value: 'light', label: t('pages.me.modeLight'), icon: Sun },
        { value: 'dark', label: t('pages.me.modeDark'), icon: Moon },
      ]}
    />
  )
}

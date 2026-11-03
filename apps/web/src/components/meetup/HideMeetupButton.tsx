import { useTranslation } from 'react-i18next'
import { EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Quiet link-style button "ซ่อนนัดนี้ (ไม่บอกใคร)" under the answer buttons (decision #32).
export function HideMeetupButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  const { t } = useTranslation()
  return (
    <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClick} disabled={disabled}>
      <EyeOff aria-hidden="true" />
      {t('meetup.hide')}
    </Button>
  )
}

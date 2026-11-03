import { useTranslation } from 'react-i18next'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

type NumberStepperProps = {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  /** Accessible name, e.g. "จำนวนคน". */
  label: string
}

// − value + control for small whole numbers (people count, quantity).
export function NumberStepper({ value, onChange, min, max, label }: NumberStepperProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('common.decrease')}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus />
      </Button>
      <output className="min-w-8 text-center text-xl font-medium tabular-nums" aria-live="polite">
        {value}
      </output>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('common.increase')}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  )
}

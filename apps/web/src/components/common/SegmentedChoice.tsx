import { Button } from '@/components/ui/button'

type Option<T extends string> = { value: T; label: string }

type SegmentedChoiceProps<T extends string> = {
  options: Option<T>[]
  /** null = nothing chosen yet. */
  value: T | null
  onChange: (value: T) => void
  /** Accessible name of the group, e.g. "เลือกธีม". */
  label: string
}

// Row of equal-width buttons where one option is chosen (filled).
// Used for: meetup responses, theme, language. Reuse it for any "pick one of 2-4" control.
export function SegmentedChoice<T extends string>({ options, value, onChange, label }: SegmentedChoiceProps<T>) {
  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      {options.map((option) => (
        <Button
          key={option.value}
          className="flex-1"
          variant={value === option.value ? 'default' : 'outline'}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}

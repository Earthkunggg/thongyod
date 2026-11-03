import { useTranslation } from 'react-i18next'
import type { MeetupResponse } from '@thongyod/shared'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'

type ResponsePickerProps = {
  value: MeetupResponse | null
  onChange: (value: MeetupResponse) => void
  /** Meetup title, used in the accessible group label. */
  label: string
}

// ไป / อาจจะ / ไม่ไป for a meetup. Use everywhere a meetup can be answered.
export function ResponsePicker({ value, onChange, label }: ResponsePickerProps) {
  const { t } = useTranslation()
  return (
    <SegmentedChoice<MeetupResponse>
      label={t('meetup.respondTo', { title: label })}
      value={value}
      onChange={onChange}
      options={[
        { value: 'going', label: t('meetup.going') },
        { value: 'maybe', label: t('meetup.maybe') },
        { value: 'not_going', label: t('meetup.notGoing') },
      ]}
    />
  )
}

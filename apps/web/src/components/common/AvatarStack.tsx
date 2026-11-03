import { useTranslation } from 'react-i18next'
import { Avatar } from './Avatar'

type AvatarStackProps = {
  names: string[]
  /** Total number of people; shows "+N" for the ones not drawn. */
  total: number
}

// Overlapping small avatars, e.g. who is going to a meetup.
export function AvatarStack({ names, total }: AvatarStackProps) {
  const { t } = useTranslation()
  const extra = total - names.length
  if (total === 0) return null
  return (
    <span className="flex items-center" aria-hidden="true">
      {names.map((name, i) => (
        <Avatar key={`${name}-${i}`} name={name} className="-ml-1.5 size-6 text-[11px] ring-2 ring-card first:ml-0" />
      ))}
      {extra > 0 && <span className="ml-1 text-xs text-muted-foreground">{t('meetup.moreCount', { count: extra })}</span>}
    </span>
  )
}

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// PLACEHOLDER drawing of Maew Gon. Will be replaced by pre-rendered images of the 3D model
// (decision #12: no 3D outside the pet room).
export function PetCat({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <svg viewBox="0 0 48 44" className={cn('size-12 shrink-0', className)} role="img" aria-label={t('pet.defaultName')}>
      <path d="M8 16 L11 3 L19 11 Z M40 16 L37 3 L29 11 Z" fill="#ef9f27" />
      <ellipse cx="24" cy="26" rx="21" ry="17" fill="#ef9f27" />
      <ellipse cx="17" cy="25" rx="2.6" ry="3.2" fill="#412402" />
      <ellipse cx="31" cy="25" rx="2.6" ry="3.2" fill="#412402" />
      <path d="M21 31 Q24 33.5 27 31" stroke="#412402" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

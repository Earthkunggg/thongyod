import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** Accessible name, e.g. "ค้นหาในเพื่อนของฉัน". */
  label: string
}

// Search box with a clear (✕) button. Debounce the value where it is used (useDebouncedValue).
export function SearchInput({ value, onChange, placeholder, label }: SearchInputProps) {
  const { t } = useTranslation()
  return (
    <div role="search" className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="search"
        autoComplete="off"
        className="pr-11 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.clearSearch')}
          className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center text-muted-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

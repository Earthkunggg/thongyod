import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGangList } from '@/api/gangs'
import { EmptyState } from '@/components/common/EmptyState'
import { InfiniteList } from '@/components/common/InfiniteList'
import { ListRow } from '@/components/common/ListRow'
import { SearchInput } from '@/components/common/SearchInput'
import { GangAvatar } from '@/components/gang/GangAvatar'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

// Sub-tab "แก๊ง" (inside GangsLayout): my gangs, paged + search (#43). Tap = gang page.
// Latest activity / unread dots (spec §6.1) wait for a gang activity API.
export function GangsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const q = useDebouncedValue(query.trim())
  const list = useGangList(q)

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="px-3">
        <SearchInput value={query} onChange={setQuery} placeholder={t('gang.filterPlaceholder')} label={t('gang.filterLabel')} />
      </div>
      <InfiniteList
        query={list}
        getKey={(g) => g.id}
        renderItem={(g) => (
          <ListRow leading={<GangAvatar id={g.id} name={g.name} />} title={g.name} subtitle={t('gang.memberCount', { count: g.memberCount })} to={`/gangs/${g.id}`} />
        )}
        empty={q === '' ? <EmptyState title={t('gang.empty')} hint={t('gang.emptyHint')} /> : <EmptyState title={t('gang.noMatch', { q })} />}
      />
    </div>
  )
}

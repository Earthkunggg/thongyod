import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { AtSign, QrCode, ScanLine, Search } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useFriendList, useFriendRequests, useHandleSearch } from '@/api/friends'
import type { FriendRequest } from '@/api/types'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { InfiniteList } from '@/components/common/InfiniteList'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SearchInput } from '@/components/common/SearchInput'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PersonCardRow } from '@/components/friends/PersonCardRow'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useFriendActions } from '@/features/friends/useFriendActions'
import { useFriendSubtitle } from '@/features/friends/useFriendSubtitle'
import { useDebouncedValue } from '@/lib/useDebouncedValue'

// Sub-tab "เพื่อน": add by @handle or QR, requests, and my friends (paged + search). Decisions #34, #43, #45.
export function FriendsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3 py-3">
      <AddByHandle />
      <div className="grid grid-cols-2 gap-2 px-3">
        <Link to="/friends/qr" className={buttonVariants({ variant: 'outline', className: 'bg-card' })}>
          <QrCode aria-hidden="true" />
          {t('friends.myQr')}
        </Link>
        <Link to="/friends/qr?mode=scan" className={buttonVariants({ variant: 'outline', className: 'bg-card' })}>
          <ScanLine aria-hidden="true" />
          {t('friends.scanQr')}
        </Link>
      </div>
      <Requests />
      <MyFriends />
    </div>
  )
}

/** Find a stranger by exact @handle (no name search, #45). */
function AddByHandle() {
  const { t } = useTranslation()
  const [handle, setHandle] = useState('')
  const [searched, setSearched] = useState('')
  const search = useHandleSearch(searched)
  const notFound = search.error instanceof ApiError && search.error.status === 404

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setSearched(handle.trim().replace(/^@/, '').toLowerCase())
  }

  return (
    <section className="flex flex-col gap-2">
      <form onSubmit={onSearch} role="search" className="flex gap-2 px-3">
        <div className="relative flex-1">
          <AtSign className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={t('friends.handlePlaceholder')}
            aria-label={t('friends.handleLabel')}
            enterKeyHint="search"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="pl-9"
          />
        </div>
        <Button type="submit" size="icon" aria-label={t('friends.search')} disabled={handle.trim().replace(/^@/, '') === ''}>
          <Search />
        </Button>
      </form>
      {searched !== '' && (
        <div aria-live="polite">
          {search.isPending ? (
            <LoadingState rows={1} />
          ) : notFound ? (
            <Card className="mx-3">
              <EmptyState title={t('friends.notFound', { handle: searched })} hint={t('friends.notFoundHint')} />
            </Card>
          ) : search.isError ? (
            <ErrorState onRetry={() => void search.refetch()} />
          ) : (
            <Card className="mx-3 px-4 py-1">
              <PersonCardRow user={search.data} />
            </Card>
          )}
        </div>
      )}
    </section>
  )
}

function Requests() {
  const { t } = useTranslation()
  const requests = useFriendRequests()
  const actions = useFriendActions()
  const subtitle = useFriendSubtitle()
  if (!requests.data) return null // small extra section: no loading/error noise

  const row = (r: FriendRequest, trailing: ReactNode) => (
    <ListRow
      key={r.id}
      leading={<Avatar name={r.user.displayName} src={r.user.avatarUrl} />}
      title={r.user.displayName}
      subtitle={subtitle(r.user.handle, null, r.mutualFriends)}
      to={`/u/${r.user.userId}`}
      trailing={trailing}
    />
  )

  return (
    <>
      {requests.data.incoming.length > 0 && (
        <section>
          <SectionHeader title={t('friends.requests', { count: requests.data.incoming.length })} />
          <Card className="mx-3 px-4 py-1">
            {requests.data.incoming.map((r) =>
              row(
                r,
                <>
                  <Button size="sm" disabled={actions.isBusy} onClick={() => actions.accept(r.id, r.user)}>
                    {t('friends.accept')}
                  </Button>
                  <Button size="sm" variant="outline" disabled={actions.isBusy} onClick={() => actions.decline(r.id)}>
                    {t('friends.decline')}
                  </Button>
                </>,
              ),
            )}
          </Card>
        </section>
      )}
      {requests.data.outgoing.length > 0 && (
        <section>
          <SectionHeader title={t('friends.sent', { count: requests.data.outgoing.length })} />
          <Card className="mx-3 px-4 py-1">
            {requests.data.outgoing.map((r) =>
              row(
                r,
                <Button size="sm" variant="ghost" disabled={actions.isBusy} onClick={() => actions.cancel(r.id)}>
                  {t('common.cancel')}
                </Button>,
              ),
            )}
          </Card>
        </section>
      )}
    </>
  )
}

/** My friends: paged, with search by part of a name or handle (#43). */
function MyFriends() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const q = useDebouncedValue(query.trim())
  const list = useFriendList(q)
  const subtitle = useFriendSubtitle()

  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title={t('friends.myFriends')} />
      <div className="px-3">
        <SearchInput value={query} onChange={setQuery} placeholder={t('friends.filterPlaceholder')} label={t('friends.filterLabel')} />
      </div>
      <InfiniteList
        query={list}
        getKey={(f) => f.userId}
        renderItem={(f) => (
          <ListRow
            leading={<Avatar name={f.displayName} src={f.avatarUrl} />}
            title={f.displayName}
            subtitle={subtitle(f.handle, f.title)}
            to={`/u/${f.userId}`}
          />
        )}
        empty={
          q === '' ? (
            <EmptyState title={t('friends.empty')} hint={t('friends.emptyHint')} />
          ) : (
            <EmptyState title={t('friends.noMatch', { q })} />
          )
        }
      />
    </section>
  )
}

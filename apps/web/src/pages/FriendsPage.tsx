import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { QrCode, ScanLine, Search } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useFriends, useUserSearch } from '@/api/friends'
import { Avatar } from '@/components/common/Avatar'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ListRow } from '@/components/common/ListRow'
import { LoadingState } from '@/components/common/LoadingState'
import { SectionHeader } from '@/components/common/SectionHeader'
import { PersonCardRow } from '@/components/friends/PersonCardRow'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useFriendActions } from '@/features/friends/useFriendActions'
import { useFriendSubtitle } from '@/features/friends/useFriendSubtitle'

// Sub-tab "เพื่อน": exact-name search, add by QR, requests, friend list (decision #34).
export function FriendsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState('')
  const search = useUserSearch(searched)
  const friendsQuery = useFriends()
  const actions = useFriendActions()
  const subtitle = useFriendSubtitle()

  function onSearch(event: FormEvent) {
    event.preventDefault()
    setSearched(query.trim())
  }

  const notFound = search.error instanceof ApiError && search.error.status === 404
  const data = friendsQuery.data

  return (
    <div className="flex flex-col gap-3 py-3">
      <form onSubmit={onSearch} role="search" className="flex gap-2 px-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('friends.searchPlaceholder')}
          aria-label={t('friends.searchLabel')}
          enterKeyHint="search"
          autoComplete="off"
        />
        <Button type="submit" size="icon" aria-label={t('friends.search')} disabled={query.trim() === ''}>
          <Search />
        </Button>
      </form>

      {searched !== '' && (
        <section aria-live="polite">
          {search.isPending ? (
            <LoadingState rows={1} />
          ) : notFound ? (
            <Card className="mx-3">
              <EmptyState title={t('friends.notFound', { name: searched })} hint={t('friends.notFoundHint')} />
            </Card>
          ) : search.isError ? (
            <ErrorState onRetry={() => void search.refetch()} />
          ) : (
            <Card className="mx-3 px-4 py-1">
              <PersonCardRow user={search.data} />
            </Card>
          )}
        </section>
      )}

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

      {friendsQuery.isPending ? (
        <LoadingState rows={3} />
      ) : !data ? (
        <ErrorState onRetry={() => void friendsQuery.refetch()} />
      ) : (
        <>
          {data.incoming.length > 0 && (
            <section>
              <SectionHeader title={t('friends.requests', { count: data.incoming.length })} />
              <Card className="mx-3 px-4 py-1">
                {data.incoming.map((r) => (
                  <ListRow
                    key={r.id}
                    leading={<Avatar name={r.user.displayName} />}
                    title={r.user.displayName}
                    subtitle={subtitle(null, r.mutualFriends)}
                    trailing={
                      <>
                        <Button size="sm" disabled={actions.isBusy} onClick={() => actions.accept(r.id, r.user)}>
                          {t('friends.accept')}
                        </Button>
                        <Button size="sm" variant="outline" disabled={actions.isBusy} onClick={() => actions.decline(r.id)}>
                          {t('friends.decline')}
                        </Button>
                      </>
                    }
                  />
                ))}
              </Card>
            </section>
          )}

          {data.outgoing.length > 0 && (
            <section>
              <SectionHeader title={t('friends.sent', { count: data.outgoing.length })} />
              <Card className="mx-3 px-4 py-1">
                {data.outgoing.map((r) => (
                  <ListRow
                    key={r.id}
                    leading={<Avatar name={r.user.displayName} />}
                    title={r.user.displayName}
                    subtitle={subtitle(null, r.mutualFriends)}
                    trailing={
                      <Button size="sm" variant="ghost" disabled={actions.isBusy} onClick={() => actions.cancel(r.id)}>
                        {t('common.cancel')}
                      </Button>
                    }
                  />
                ))}
              </Card>
            </section>
          )}

          <section>
            <SectionHeader title={t('friends.list', { count: data.friends.length })} />
            <Card className="mx-3 px-4 py-1">
              {data.friends.length > 0 ? (
                data.friends.map((f) => (
                  <ListRow
                    key={f.userId}
                    leading={<Avatar name={f.displayName} />}
                    title={f.displayName}
                    subtitle={f.title ?? undefined}
                  />
                ))
              ) : (
                <EmptyState title={t('friends.empty')} hint={t('friends.emptyHint')} />
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  )
}

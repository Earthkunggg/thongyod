import { useEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import type { CursorPage } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

type InfiniteListProps<T> = {
  query: UseInfiniteQueryResult<InfiniteData<CursorPage<T>>>
  renderItem: (item: T) => ReactNode
  getKey: (item: T) => string
  /** Shown when the list has no items (e.g. <EmptyState>). */
  empty: ReactNode
}

// A list that loads more by itself near the bottom (decision #43), inside a Card.
// Footer: loading row / error + "โหลดเพิ่ม" / "หมดแล้ว". Use with useCursorList().
export function InfiniteList<T>({ query, renderItem, getKey, empty }: InfiniteListProps<T>) {
  const { t } = useTranslation()
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query

  useEffect(() => {
    const element = sentinel.current
    if (!element || !hasNextPage || isFetchNextPageError) return
    // Start loading a bit before the user reaches the end.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) void fetchNextPage()
      },
      { rootMargin: '400px 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  if (query.isPending) return <LoadingState rows={3} />
  if (query.isError && !query.data) return <ErrorState onRetry={() => void query.refetch()} />

  const pages = query.data?.pages ?? []
  const items = pages.flatMap((page) => page.items)
  if (items.length === 0) return <Card className="mx-3">{empty}</Card>

  return (
    <div className="flex flex-col gap-2">
      <Card className="mx-3 px-4 py-1">
        {items.map((item) => (
          <div key={getKey(item)} className="[&+&]:border-t">
            {renderItem(item)}
          </div>
        ))}
      </Card>
      <div ref={sentinel} aria-live="polite" className="flex min-h-6 flex-col items-center px-3 text-xs text-muted-foreground">
        {isFetchingNextPage && <Skeleton className="h-14 w-full rounded-xl" aria-label={t('common.loading')} />}
        {isFetchNextPageError && (
          <div className="flex items-center gap-2">
            <span>{t('common.loadError')}</span>
            <Button variant="outline" size="sm" onClick={() => void fetchNextPage()}>
              {t('common.loadMore')}
            </Button>
          </div>
        )}
        {!hasNextPage && pages.length > 1 && <span className="py-2">{t('common.endOfList')}</span>}
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'

type Pager = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  fetchNextPage: () => Promise<unknown>
}

/**
 * Loads the next page when the returned element comes near the screen (#43).
 * Put the ref on an element under the list. Stops after an error (show a "โหลดเพิ่ม" button then).
 */
export function useInfiniteScroll({ hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage }: Pager) {
  const sentinel = useRef<HTMLDivElement>(null)
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
  return sentinel
}

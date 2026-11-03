import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Grey pulsing block shown while data loads (shadcn/ui Skeleton, MIT).
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}

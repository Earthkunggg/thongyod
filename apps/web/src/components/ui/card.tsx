import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// Basic surface for grouped content. Use instead of hand-written "rounded border bg-white" divs.
export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('rounded-xl border bg-card text-card-foreground', className)}
      {...props}
    />
  )
}

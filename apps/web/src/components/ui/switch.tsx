import type { ComponentProps } from 'react'
import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import { cn } from '@/lib/utils'

// On/off switch (Base UI Switch, MIT), styled with theme tokens. 44px touch area via padding.
export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Off: outlined track + grey knob, so it stays visible on cards in dark mode too.
        'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-muted p-0.5 ring-1 ring-border ring-inset transition-colors duration-150 data-checked:ring-0',
        'outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-checked:bg-primary data-disabled:opacity-50',
        'before:absolute before:-inset-2 before:content-[""]',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="size-6 rounded-full bg-muted-foreground/70 shadow-sm transition-[translate,background-color] duration-150 data-checked:translate-x-5 data-checked:bg-card" />
    </SwitchPrimitive.Root>
  )
}

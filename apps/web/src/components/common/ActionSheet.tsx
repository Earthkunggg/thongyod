import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type SheetAction = { key: string; label: string; icon?: LucideIcon; destructive?: boolean; onSelect: () => void }

type ActionSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  actions: SheetAction[]
}

// A short list of actions in a dialog (the "⋯" menu), e.g. unfriend / block. Has a cancel button.
export function ActionSheet({ open, onOpenChange, title, actions }: ActionSheetProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title}>
        <div className="flex flex-col gap-2">
          {actions.map(({ key, label, icon: Icon, destructive, onSelect }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onOpenChange(false)
                onSelect()
              }}
              className={cn(
                'flex h-12 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium active:bg-muted',
                destructive && 'text-destructive',
              )}
            >
              {Icon && <Icon className="size-5" aria-hidden="true" />}
              {label}
            </button>
          ))}
          <DialogClose className={buttonVariants({ variant: 'outline' })}>{t('common.cancel')}</DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}

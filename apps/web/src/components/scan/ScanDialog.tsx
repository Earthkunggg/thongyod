import { useTranslation } from 'react-i18next'
import { AppScanner } from '@/components/scan/AppScanner'
import { Dialog, DialogContent } from '@/components/ui/dialog'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

// The one QR scanner in a dialog. The camera only runs while the dialog is open.
export function ScanDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('scan.title')}>{open && <AppScanner onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  )
}

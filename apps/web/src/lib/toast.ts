// One global toast manager, so any code (pages, hooks) can show a toast.
// The toasts are drawn by <Toaster /> (components/ui/toaster.tsx), mounted once in main.tsx.
import { Toast } from '@base-ui/react/toast'
import i18n from '@/i18n'

export const toastManager = Toast.createToastManager()

/** How long an undo bar stays (decision #35: 4 seconds). */
const UNDO_TIMEOUT_MS = 4000

/** Short message with a "ย้อนกลับ" button. */
export function showUndoToast({ title, description, onUndo }: { title: string; description?: string; onUndo: () => void }) {
  const id = toastManager.add({
    title,
    description,
    timeout: UNDO_TIMEOUT_MS,
    actionProps: {
      children: i18n.t('common.undo'),
      onClick: () => {
        toastManager.close(id)
        onUndo()
      },
    },
  })
}

export function showErrorToast(title: string) {
  toastManager.add({ title, type: 'error', priority: 'high' })
}

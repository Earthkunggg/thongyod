import { Toast } from '@base-ui/react/toast'
import { toastManager } from '@/lib/toast'

// Draws toasts (Base UI Toast, MIT). Mount once in main.tsx. Show toasts with lib/toast.ts.
// Placed above the bottom tab bar, phone width. Only the newest toast is shown.
export function Toaster() {
  return (
    <Toast.Provider toastManager={toastManager} limit={1}>
      <Toast.Portal>
        <Toast.Viewport className="fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-[calc(100%-1.5rem)] max-w-[26rem]">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  )
}

function ToastList() {
  const { toasts } = Toast.useToastManager()
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="absolute inset-x-0 bottom-0 rounded-xl bg-foreground text-background shadow-lg transition-[transform,opacity] duration-200 ease-out select-none data-ending-style:translate-y-4 data-ending-style:opacity-0 data-limited:hidden data-starting-style:translate-y-4 data-starting-style:opacity-0 motion-reduce:transition-none"
    >
      <Toast.Content className="flex min-h-12 items-center gap-3 py-2 pr-2 pl-4">
        <div className="min-w-0 flex-1">
          <Toast.Title className="truncate text-sm font-medium" />
          <Toast.Description className="truncate text-xs opacity-80" />
        </div>
        <Toast.Action className="h-10 shrink-0 rounded-lg px-3 text-sm font-medium text-primary active:bg-background/10" />
      </Toast.Content>
    </Toast.Root>
  ))
}

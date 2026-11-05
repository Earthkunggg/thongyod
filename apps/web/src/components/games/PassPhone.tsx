import type { ReactNode } from 'react'
import { Hand } from 'lucide-react'
import './games.css'

type PassPhoneProps = {
  /** "ส่งมือถือให้ ผู้เล่น 3" */
  title: string
  hint?: string
  action: string
  onContinue: () => void
  children?: ReactNode
}

// Full cover between players on one phone, so nobody sees the previous secret. Tap anywhere to continue.
export function PassPhone({ title, hint, action, onContinue, children }: PassPhoneProps) {
  return (
    <div className="flex min-h-[70dvh] flex-col px-4 pb-6">
      <button
        type="button"
        onClick={onContinue}
        className="flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl bg-accent p-6 text-center text-accent-foreground active:opacity-80"
      >
        <Hand className="game-breathe size-14" aria-hidden="true" />
        <span className="text-2xl font-medium">{title}</span>
        {hint && <span className="text-sm">{hint}</span>}
        <span className="mt-4 rounded-xl bg-primary px-6 py-3 text-base font-medium text-primary-foreground">{action}</span>
      </button>
      {children}
    </div>
  )
}

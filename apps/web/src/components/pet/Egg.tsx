import './pet.css'
import { cn } from '@/lib/utils'

export type EggStyle = 'fire' | 'sleepy' | 'mystery'

const EGGS: Record<EggStyle, { shell: string; spot: string; line: string }> = {
  fire: { shell: '#FFD9D2', spot: '#FC8E99', line: '#C9575F' },
  sleepy: { shell: '#FFF1D6', spot: '#F9C96B', line: '#D69A3A' },
  mystery: { shell: '#E9E3FA', spot: '#B6A6EE', line: '#7F6FC9' },
}

type EggProps = { style: EggStyle; state?: 'idle' | 'wobble' | 'crack'; className?: string }

// A pet egg for the first hatch (choose 1 of 3, DECISIONS #47). Pure SVG + CSS animation.
export function Egg({ style, state = 'idle', className }: EggProps) {
  const c = EGGS[style]
  return (
    <svg viewBox="0 0 120 150" aria-hidden="true" className={cn('egg', state === 'wobble' && 'egg-wobble', state === 'crack' && 'egg-crack', className)}>
      <ellipse cx="60" cy="140" rx="34" ry="6" fill="#000" opacity="0.08" />
      <path d="M60 8 C92 8 112 60 112 92 C112 122 90 140 60 140 C30 140 8 122 8 92 C8 60 28 8 60 8 Z" fill={c.shell} stroke={c.line} strokeWidth="4" />
      <circle cx="40" cy="70" r="10" fill={c.spot} />
      <circle cx="78" cy="52" r="7" fill={c.spot} />
      <circle cx="84" cy="100" r="12" fill={c.spot} />
      <circle cx="48" cy="112" r="6" fill={c.spot} />
      {style === 'mystery' && <path d="M52 78 q0-12 10-12 q10 0 10 9 q0 7-9 10 v6" fill="none" stroke={c.line} strokeWidth="5" strokeLinecap="round" />}
      {state === 'crack' && <path d="M14 80 l14 -8 l10 10 l12 -12 l10 10 l12 -12 l10 10 l14 -8" fill="none" stroke={c.line} strokeWidth="4" strokeLinejoin="round" />}
      <ellipse cx="40" cy="38" rx="9" ry="14" fill="#fff" opacity="0.6" transform="rotate(-20 40 38)" />
    </svg>
  )
}

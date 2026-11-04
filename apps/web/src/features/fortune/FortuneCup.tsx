import { cn } from '@/lib/utils'
import './fortune.css'

type Props = {
  state: 'idle' | 'shaking' | 'out'
  /** Number on the stick that popped out (when state is 'out'). */
  stick?: number
  className?: string
}

// Our own fortune cup drawing (SVG). Sticks peek out; one jumps up with its number after a shake.
export function FortuneCup({ state, stick, className }: Props) {
  return (
    <svg viewBox="0 -70 160 300" className={cn('overflow-visible', className)} aria-hidden="true">
      <g className={cn('cup', state === 'shaking' && 'cup-shake')}>
        {/* sticks inside */}
        {[46, 56, 66, 75, 85, 94, 104, 114].map((x, i) => (
          <g key={x} transform={`rotate(${(i - 3.5) * 1.6} ${x} 200)`}>
            <rect x={x - 3.5} y={46 + (i % 3) * 7} width="7" height="130" rx="3.5" fill="#E8C48A" />
            <rect x={x - 3.5} y={46 + (i % 3) * 7} width="7" height="14" rx="3.5" fill="#D9534F" />
          </g>
        ))}
        {/* cup */}
        <path d="M30 92 H130 L122 212 Q121 222 111 222 H49 Q39 222 38 212 Z" fill="#C8443F" />
        <path d="M30 92 H130 L129 106 H31 Z" fill="#F2C14E" />
        <path d="M35 186 H125 L124 198 H36 Z" fill="#F2C14E" />
        <ellipse cx="80" cy="92" rx="50" ry="9" fill="#8E2B28" />
        {/* five-petal flower badge */}
        <circle cx="80" cy="146" r="21" fill="#F2C14E" />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx="80" cy="137" r="6.5" fill="#C8443F" transform={`rotate(${a} 80 146)`} />
        ))}
        <circle cx="80" cy="146" r="4.5" fill="#F2C14E" />
      </g>
      {state === 'out' && stick !== undefined && (
        <g className="stick-pop">
          <rect x="68" y="-62" width="24" height="140" rx="8" fill="#F3D9A4" stroke="#B9873E" strokeWidth="2" />
          <rect x="68" y="-62" width="24" height="18" rx="8" fill="#D9534F" />
          <text x="80" y="-14" textAnchor="middle" dominantBaseline="central" fontSize="20" fontWeight="700" fill="#5A3A12">
            {stick}
          </text>
        </g>
      )}
    </svg>
  )
}

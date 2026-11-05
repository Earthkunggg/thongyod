import { cn } from '@/lib/utils'
import type { Face } from './logic'
import '@/components/games/games.css'

/** Pip cells (1–9 in a 3×3 grid, row by row) for each face. */
const PIPS: Record<Face, number[]> = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }

type DieProps = { rotation: { x: number; y: number }; rollKey: number; className?: string; faceClass: string }

// A 3D die. The parent decides the face (fair random) and passes the rotation from tumble().
export function Die({ rotation, rollKey, className, faceClass }: DieProps) {
  return (
    <div key={rollKey} className={cn('die', rollKey > 0 && 'die-hop', className)} aria-hidden="true">
      <div className="die-cube" style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}>
        {([1, 2, 3, 4, 5, 6] as Face[]).map((f) => (
          <div key={f} className={cn('die-face', faceClass)} data-f={f}>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} style={{ gridArea: `${Math.floor(i / 3) + 1} / ${(i % 3) + 1}` }}>{PIPS[f].includes(i + 1) && <span className="die-pip block" />}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

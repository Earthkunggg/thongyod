import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils'
import type { Bill } from './bill'
import { personColor } from './colors'
import { usePersonName } from './names'

/** One person's colored avatar (color = their position in the bill). */
export function Face({ bill, id, className }: { bill: Bill; id: string; className?: string }) {
  const nameOf = usePersonName(bill)
  const i = bill.people.findIndex((p) => p.id === id)
  return <Avatar name={nameOf(id)} className={cn('size-7 text-xs', personColor(Math.max(0, i)), className)} />
}

/** Small overlapping faces, e.g. who shares an item. */
export function Faces({ bill, ids }: { bill: Bill; ids: string[] }) {
  return (
    <span className="flex">
      {ids.map((id) => (
        <Face key={id} bill={bill} id={id} className="-ml-1.5 size-6 text-[11px] ring-2 ring-card first:ml-0" />
      ))}
    </span>
  )
}

/** Tap faces to choose people (multi-select). Nobody chosen = everyone. */
export function FacePicker({ bill, value, onChange, label }: { bill: Bill; value: string[]; onChange: (ids: string[]) => void; label: string }) {
  const nameOf = usePersonName(bill)
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {bill.people.map((p) => {
        const on = value.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={on}
            aria-label={nameOf(p.id)}
            onClick={() => onChange(on ? value.filter((x) => x !== p.id) : [...value, p.id])}
            className={cn('rounded-full transition-[opacity,transform] active:scale-90', on ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-40')}
          >
            <Face bill={bill} id={p.id} className="size-9 text-sm" />
          </button>
        )
      })}
    </div>
  )
}

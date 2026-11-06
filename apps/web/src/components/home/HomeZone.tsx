import type { ReactNode } from 'react'

type HomeZoneProps = {
  title: string
  /** Optional link on the right, e.g. <SeeAllLink />. */
  action?: ReactNode
  children: ReactNode
}

// One zone of Home (decision #83): a big title, then its content. Zones are split by a line and space,
// so Home reads as วันนี้ / เพื่อน / น้อง / ทางลัด instead of one long run of same-looking cards.
export function HomeZone({ title, action, children }: HomeZoneProps) {
  return (
    <section className="flex flex-col gap-2 border-t pt-5 first:border-t-0 first:pt-1">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

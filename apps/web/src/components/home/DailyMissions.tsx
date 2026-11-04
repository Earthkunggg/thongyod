import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Circle, CircleCheck, PartyPopper } from 'lucide-react'
import { SectionHeader } from '@/components/common/SectionHeader'
import { doneToday, MISSIONS, useDaily, type MissionId } from '@/features/daily/daily'
import { cn } from '@/lib/utils'
import { SHOW_BACK } from '@/lib/nav'

const MISSION_TO: Record<MissionId, string> = { fortune: '/fortune', pet: '/pet', tool: '/explore' }

// "ภารกิจวันนี้": 3 small things, each a link to where you do it. No penalty for skipping (DECISIONS #54).
export function DailyMissions({ petName }: { petName: string }) {
  const { t } = useTranslation()
  const log = useDaily()
  const done = doneToday(log)
  const all = done.length === MISSIONS.length
  return (
    <section>
      <SectionHeader title={t('home.missionsTitle', { done: done.length, total: MISSIONS.length })} />
      <div className="mx-3 grid grid-cols-3 gap-2">
        {MISSIONS.map((id) => {
          const ok = done.includes(id)
          return (
            <Link
              key={id}
              to={MISSION_TO[id]}
              state={SHOW_BACK}
              className={cn('flex flex-col items-start gap-1 rounded-xl border bg-card p-2.5 text-xs active:bg-muted/50', ok && 'border-primary/40 bg-primary/5')}
            >
              {ok ? <CircleCheck className="size-5 text-primary" aria-hidden="true" /> : <Circle className="size-5 text-muted-foreground/50" aria-hidden="true" />}
              <span className={cn(ok && 'text-muted-foreground line-through')}>{t(`home.missions.${id}`, { name: petName })}</span>
            </Link>
          )
        })}
      </div>
      <p className={cn('mx-4 mt-1.5 flex items-center gap-1 text-xs', all ? 'font-medium text-primary' : 'text-muted-foreground')}>
        {all && <PartyPopper className="size-3.5" aria-hidden="true" />}
        {all ? t('home.missionsDone', { name: petName }) : t('home.missionsHint', { name: petName })}
      </p>
    </section>
  )
}

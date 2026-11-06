import { useTranslation } from 'react-i18next'
import { Circle, CircleCheck, PartyPopper } from 'lucide-react'
import { ListRow } from '@/components/common/ListRow'
import { Card } from '@/components/ui/card'
import { doneToday, MISSIONS, useDaily, type MissionId } from '@/features/daily/daily'
import { SHOW_BACK } from '@/lib/nav'
import { cn } from '@/lib/utils'

const MISSION_TO: Record<MissionId, string> = { fortune: '/fortune', pet: '/pet', tool: '/explore' }

// "ภารกิจวันนี้": 3 small things, each a row linking to where you do it. No penalty for skipping (DECISIONS #54).
// Lives in the pet zone of Home (#83), which gives it its title.
export function DailyMissions({ petName }: { petName: string }) {
  const { t } = useTranslation()
  const log = useDaily()
  const done = doneToday(log)
  const all = done.length === MISSIONS.length
  return (
    <div className="flex flex-col gap-1.5">
      <Card className="mx-3 px-4 py-1">
        {MISSIONS.map((id) => {
          const ok = done.includes(id)
          return (
            <ListRow
              key={id}
              to={MISSION_TO[id]}
              linkState={SHOW_BACK}
              leading={ok ? <CircleCheck className="size-5 shrink-0 text-primary" aria-hidden="true" /> : <Circle className="size-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />}
              title={t(`home.missions.${id}`, { name: petName })}
              subtitle={ok ? t('home.missionDone') : undefined}
            />
          )
        })}
      </Card>
      <p className={cn('mx-4 flex items-center gap-1 text-xs', all ? 'font-medium text-primary' : 'text-muted-foreground')}>
        {all && <PartyPopper className="size-3.5" aria-hidden="true" />}
        {all ? t('home.missionsDone', { name: petName }) : t('home.missionsHint', { name: petName })}
      </p>
    </div>
  )
}

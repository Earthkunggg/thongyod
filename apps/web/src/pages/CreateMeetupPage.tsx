import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Users } from 'lucide-react'
import { ApiError } from '@/api/client'
import { useMyGangs } from '@/api/gangs'
import { useCreateMeetup } from '@/api/meetups'
import { useProfile } from '@/api/profile'
import type { GangSummary } from '@/api/types'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { OptionList } from '@/components/common/OptionList'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { SuggestionChips } from '@/components/common/SuggestionChips'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  checkCreateForm,
  combineDateTime,
  dateFor,
  DEFAULT_TIME,
  initialDay,
  TITLE_MAX,
  toDateInput,
  type CreateProblem,
  type DayChoice,
} from '@/features/meetups/createForm'
import { formatDayLabel, formatTime } from '@/lib/date'
import { showErrorToast, toastManager } from '@/lib/toast'

const LAST_GANG_KEY = 'thongyod-last-gang'

function readLastGang(): string | null {
  try {
    return localStorage.getItem(LAST_GANG_KEY)
  } catch {
    return null
  }
}

function saveLastGang(id: string) {
  try {
    localStorage.setItem(LAST_GANG_KEY, id)
  } catch {
    // Not important if storage is blocked.
  }
}

/** Last used gang first, then the rest in server order. */
function sortGangs(gangs: GangSummary[], lastId: string | null): GangSummary[] {
  const last = gangs.find((g) => g.id === lastId)
  return last ? [last, ...gangs.filter((g) => g !== last)] : gangs
}

// /meetups/new — "ชวนนัด": gang → what → when → ชวนเลย. Then the detail page with a LINE share button.
// /meetups/new?with=<userId> (from a friend's profile) offers only gangs we share (#44).
export function CreateMeetupPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const withUser = params.get('with')
  const allGangs = useMyGangs()
  const friend = useProfile(withUser ?? '', { enabled: withUser !== null })
  const shared = new Set(friend.data?.sharedGangs.map((g) => g.id) ?? [])
  const options = withUser ? allGangs.data?.filter((g) => shared.has(g.id)) : allGangs.data
  const loading = allGangs.isPending || (withUser !== null && friend.isPending)

  return (
    <div className="flex flex-col gap-3 pb-8">
      <PageHeader
        title={t('createMeetup.title')}
        subtitle={friend.data ? t('createMeetup.withFriend', { name: friend.data.displayName }) : undefined}
        backTo="/explore"
      />
      {loading ? (
        <LoadingState rows={3} />
      ) : allGangs.isError ? (
        <ErrorState onRetry={() => void allGangs.refetch()} />
      ) : !options || options.length === 0 ? (
        <Card className="mx-3">
          <EmptyState
            title={withUser ? t('createMeetup.noSharedGangs') : t('createMeetup.noGangs')}
            hint={withUser ? undefined : t('createMeetup.noGangsHint')}
          />
        </Card>
      ) : (
        <CreateForm gangs={sortGangs(options, readLastGang())} requestedDate={params.get('date')} />
      )}
    </div>
  )
}

function CreateForm({ gangs, requestedDate }: { gangs: GangSummary[]; requestedDate: string | null }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateMeetup()
  const now = useMemo(() => new Date(), [])

  const [gangId, setGangId] = useState<string>(gangs[0].id)
  const [title, setTitle] = useState('')
  const [start] = useState(() => initialDay(requestedDate, now))
  const [day, setDay] = useState<DayChoice>(start.day)
  const [pickedDate, setPickedDate] = useState(start.picked)
  const [time, setTime] = useState(DEFAULT_TIME)
  const [tried, setTried] = useState(false)
  const [serverProblem, setServerProblem] = useState<CreateProblem>(null)

  const startsAt = combineDateTime(dateFor(day, pickedDate, now), time)
  const problem = serverProblem ?? checkCreateForm({ gangId, title, startsAt }, new Date())
  const ideas = t('createMeetup.ideas').split(',')

  const PROBLEM_TEXT: Record<Exclude<CreateProblem, null>, string> = {
    no_gang: t('createMeetup.errors.noGang'),
    no_title: t('createMeetup.errors.noTitle'),
    title_too_long: t('createMeetup.errors.titleTooLong', { max: TITLE_MAX }),
    no_time: t('createMeetup.errors.noTime'),
    in_past: t('createMeetup.errors.inPast'),
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setTried(true)
    if (problem || !startsAt) return
    create.mutate(
      { gangId, title: title.trim(), startsAt: startsAt.toISOString() },
      {
        onSuccess: (meetup) => {
          saveLastGang(gangId)
          toastManager.add({ title: t('createMeetup.created') })
          void navigate(`/meetups/${meetup.id}`, { replace: true })
        },
        onError: (error) => {
          if (error instanceof ApiError && error.code === 'INVALID_REQUEST') setServerProblem('in_past')
          else showErrorToast(t('common.saveError'))
        },
      },
    )
  }

  // Changing anything clears a server-side error.
  const edit = <T,>(setter: (v: T) => void) => (value: T) => {
    setServerProblem(null)
    setter(value)
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <section>
        <SectionHeader title={t('createMeetup.gang')} />
        <div className="px-3">
          <OptionList
            label={t('createMeetup.chooseGang')}
            value={gangId}
            onChange={edit(setGangId)}
            options={gangs.map((g) => ({
              value: g.id,
              label: g.name,
              description: t('createMeetup.members', { count: g.memberCount }),
            }))}
          />
        </div>
      </section>

      <section>
        <SectionHeader title={t('createMeetup.what')} />
        <div className="flex flex-col gap-2 px-3">
          <Input
            value={title}
            onChange={(e) => edit(setTitle)(e.target.value)}
            placeholder={t('createMeetup.titlePlaceholder')}
            aria-label={t('createMeetup.what')}
            maxLength={TITLE_MAX * 2}
            enterKeyHint="done"
          />
          <SuggestionChips label={t('createMeetup.ideasLabel')} items={ideas} onPick={edit(setTitle)} />
        </div>
      </section>

      <section>
        <SectionHeader title={t('createMeetup.when')} />
        <div className="flex flex-col gap-2 px-3">
          <SegmentedChoice<DayChoice>
            label={t('createMeetup.chooseDay')}
            value={day}
            onChange={edit(setDay)}
            options={[
              { value: 'today', label: t('time.today') },
              { value: 'tomorrow', label: t('time.tomorrow') },
              { value: 'pick', label: t('createMeetup.pickDay') },
            ]}
          />
          <div className="grid grid-cols-2 gap-2">
            {day === 'pick' && (
              <Input
                type="date"
                value={pickedDate}
                min={toDateInput(now)}
                onChange={(e) => edit(setPickedDate)(e.target.value)}
                aria-label={t('createMeetup.date')}
              />
            )}
            <Input
              type="time"
              value={time}
              onChange={(e) => edit(setTime)(e.target.value)}
              aria-label={t('createMeetup.time')}
              className={day === 'pick' ? undefined : 'col-span-2'}
            />
          </div>
          {startsAt && (
            <p className="text-sm text-muted-foreground">
              {t('createMeetup.startsPreview', { when: `${formatDayLabel(startsAt, now)} ${formatTime(startsAt)}` })}
            </p>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-2 px-3 pt-2">
        {tried && problem && (
          <p role="alert" className="text-center text-sm text-destructive">
            {PROBLEM_TEXT[problem]}
          </p>
        )}
        <Button type="submit" size="lg" disabled={create.isPending}>
          <Users aria-hidden="true" />
          {t('createMeetup.submit')}
        </Button>
      </div>
    </form>
  )
}

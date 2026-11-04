import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { CalendarPlus, ChevronRight, Clock, Receipt, Sparkles } from 'lucide-react'
import type { MeetupListItem } from '@/api/types'
import { AvatarStack } from '@/components/common/AvatarStack'
import { HScroll } from '@/components/common/HScroll'
import { billStatus, settle } from '@/features/bill-split/bill'
import { useBills } from '@/features/bill-split/storage'
import { bangkokDayKey, levelOf } from '@/features/fortune/logic'
import { loadDraw } from '@/features/fortune/storage'
import { formatDayLabel, formatTime, formatTimeUntil } from '@/lib/date'
import { cn } from '@/lib/utils'
import { tintClass } from '@/lib/tones'

type Card = { key: string; to: string; tone: string; icon: ReactNode; eyebrow: string; title: string; footer?: ReactNode }

// Swipeable highlight cards at the top of Home (Steam/Shopee "featured" row, but only my own stuff, no ads).
// Manual swipe with snap + a peek of the next card; no auto-play (it annoys and hides content).
export function Highlights({ meetups, now }: { meetups: MeetupListItem[]; now: Date }) {
  const { t } = useTranslation()
  const bills = useBills()
  const [index, setIndex] = useState(0)
  const cards: Card[] = []

  const next = meetups
    .filter((m) => new Date(m.startsAt) > now && (m.myResponse === 'going' || m.myResponse === 'maybe'))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0]
  if (next) {
    const starts = new Date(next.startsAt)
    cards.push({
      key: 'next',
      to: `/meetups/${next.id}`,
      tone: tintClass(1),
      icon: <Clock className="size-4" aria-hidden="true" />,
      eyebrow: t('home.highlight.next', { when: formatTimeUntil(starts, now) ?? '' }),
      title: `${next.title} · ${formatDayLabel(starts, now)} ${formatTime(starts)}`,
      footer: <AvatarStack names={next.goingAvatars.map((p) => p.displayName)} total={next.counts.going} />,
    })
  } else {
    cards.push({
      key: 'invite',
      to: '/meetups/new',
      tone: tintClass(1),
      icon: <CalendarPlus className="size-4" aria-hidden="true" />,
      eyebrow: t('home.highlight.noMeetup'),
      title: t('home.highlight.inviteFriends'),
    })
  }

  const draw = loadDraw()
  const drawnToday = draw && draw.day === bangkokDayKey(now)
  cards.push({
    key: 'fortune',
    to: '/fortune',
    tone: tintClass(4),
    icon: <Sparkles className="size-4" aria-hidden="true" />,
    eyebrow: t('home.highlight.fortune'),
    title: drawnToday ? t('home.highlight.fortuneDone', { n: draw.stick, level: t(`fortune.levels.${levelOf(draw.stick)}`) }) : t('home.highlight.fortuneNotYet'),
  })

  const waitingBill = bills.map((b) => ({ b, st: billStatus(b, settle(b)) })).find((x) => x.st.status === 'waiting')
  if (waitingBill) {
    cards.push({
      key: 'bill',
      to: `/bills/${waitingBill.b.id}`,
      tone: tintClass(2),
      icon: <Receipt className="size-4" aria-hidden="true" />,
      eyebrow: t('home.highlight.bill'),
      title: t('home.highlight.billWaiting', { title: waitingBill.b.title, count: waitingBill.st.waiting }),
    })
  }

  return (
    <section>
      <HScroll
        label={t('home.highlight.label')}
        onScroll={(e) => {
          const el = e.currentTarget
          const first = el.firstElementChild as HTMLElement | null
          if (first) setIndex(Math.round(el.scrollLeft / (first.offsetWidth + 8)))
        }}
      >
        {cards.map((c) => (
          <Link key={c.key} to={c.to} className={cn('flex w-[85%] shrink-0 snap-start flex-col gap-1.5 rounded-2xl p-4 active:opacity-90', c.tone)}>
            <span className="flex items-center gap-1.5 text-xs opacity-80">
              {c.icon}
              {c.eyebrow}
            </span>
            <span className="line-clamp-2 text-base font-medium">{c.title}</span>
            <span className="mt-auto flex items-center justify-between pt-1">
              {c.footer ?? <span />}
              <ChevronRight className="size-4 opacity-60" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </HScroll>
      {cards.length > 1 && (
        <div className="mt-2 flex justify-center gap-1" aria-hidden="true">
          {cards.map((c, i) => (
            <span key={c.key} className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30')} />
          ))}
        </div>
      )}
    </section>
  )
}

import { useTranslation } from 'react-i18next'
import { BookOpen, Heart, Wallet } from 'lucide-react'
import { IconTile } from '@/components/common/IconTile'
import { cn } from '@/lib/utils'
import { levelOf, type StickNo } from './logic'

const TOPIC_ICON = { study: BookOpen, money: Wallet, love: Heart } as const

const LEVEL_STYLE = {
  great: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200',
  good: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  fair: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  careful: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
} as const

// The fortune paper: number, level, a 2-line verse and one line each for study / money / love.
export function FortuneCard({ stick }: { stick: StickNo }) {
  const { t } = useTranslation()
  const level = levelOf(stick)
  const key = `fortune.sticks.s${stick}` as 'fortune.sticks.s1' // all 28 keys have the same shape
  return (
    <article className="fortune-card rounded-2xl border bg-card p-5 text-center shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{t('fortune.stickNo', { n: stick })}</span>
        <span className={cn('rounded-full px-3 py-1 text-sm font-medium', LEVEL_STYLE[level])}>{t(`fortune.levels.${level}`)}</span>
      </div>
      <p className="my-5 font-heading text-xl leading-relaxed">
        {t(`${key}.poem1`)}
        <br />
        {t(`${key}.poem2`)}
      </p>
      <dl className="grid gap-2 text-left text-sm">
        {(['study', 'money', 'love'] as const).map((topic) => (
          <div key={topic} className="flex items-center gap-3 rounded-xl bg-muted/50 px-2 py-2">
            <IconTile icon={TOPIC_ICON[topic]} className="size-8" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">{t(`fortune.${topic}`)}</dt>
              <dd>{t(`${key}.${topic}`)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </article>
  )
}

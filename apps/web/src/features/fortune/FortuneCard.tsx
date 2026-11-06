import { useTranslation } from 'react-i18next'
import { BookOpen, Clover, Heart, Users, Wallet } from 'lucide-react'
import flower from '@/assets/fortune/flower.webp'
import { Badge } from '@/components/common/Badge'
import { fortuneOf, levelOf, type StickNo } from './logic'
import { LEVEL_TONE } from './levelTone'
import './fortune.css'

const TOPICS = [
  { key: 'study', icon: BookOpen },
  { key: 'money', icon: Wallet },
  { key: 'love', icon: Heart },
  { key: 'friends', icon: Users },
] as const

// The fortune paper: number + level, a 4-line verse that appears line by line, what it means,
// study / money / love / friends, and today's lucky thing.
export function FortuneCard({ stick }: { stick: StickNo }) {
  const { t } = useTranslation()
  const level = levelOf(stick)
  const f = fortuneOf(stick)
  if (!f) return null
  return (
    <article className="fortune-paper text-center">
      <img src={flower} alt="" className="fortune-paper-flower" aria-hidden="true" />
      <div className="flex items-center justify-between">
        <span className="paper-soft text-sm">{t('fortune.stickNo', { n: stick })}</span>
        <Badge tone={LEVEL_TONE[level]} className="px-3 py-1 text-sm">
          {t(`fortune.levels.${level}`)}
        </Badge>
      </div>
      <p className="my-5 font-heading text-xl leading-relaxed">
        {f.poem.map((line, i) => (
          <span key={i} className="verse-line block" style={{ animationDelay: `${0.45 + i * 0.22}s` }}>
            {line}
          </span>
        ))}
      </p>
      <p className="paper-line mb-4 border-y border-dashed py-3 text-sm leading-relaxed">{f.meaning}</p>
      <dl className="grid gap-2 text-left text-sm">
        {TOPICS.map(({ key, icon: Icon }) => (
          <div key={key} className="paper-chip flex items-start gap-3 rounded-xl px-3 py-2.5">
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <dt className="paper-soft text-xs">{t(`fortune.${key}`)}</dt>
              <dd className="leading-snug">{f[key]}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-4 flex items-center justify-center gap-2 text-sm">
        <Clover className="size-4" aria-hidden="true" />
        <span className="paper-soft">{t('fortune.lucky')}</span>
        <b className="font-medium">{f.lucky}</b>
      </p>
    </article>
  )
}

import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Play, Shuffle, Smartphone } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { WORD_PACKS } from '@/config/wordPacks'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { MIX_PACK, type RoundSeconds } from './logic'
import type { HeadsUpSaved } from './storage'
import type { TiltSupport } from './useTilt'

type Props = {
  saved: HeadsUpSaved
  onChange: (next: HeadsUpSaved) => void
  tilt: TiltSupport
  onStart: () => void
}

// Choose a category, the round length and how to answer (tilt or taps), then start.
export function SetupScreen({ saved, onChange, tilt, onStart }: Props) {
  const { t } = useTranslation()
  const tiltPossible = tilt === 'on' || tilt === 'needs-permission'
  const set = (patch: Partial<HeadsUpSaved>) => onChange({ ...saved, ...patch })

  return (
    <div className="flex flex-col gap-3 pb-28">
      {/* How to play as three pictures (show, don't tell). */}
      <section aria-label={t('headsUp.howTitle')} className="grid grid-cols-3 gap-2 px-3">
        {[
          { icon: Smartphone, text: t('headsUp.how.forehead'), tone: 'neutral' as const },
          { icon: ArrowDown, text: t('headsUp.how.down'), tone: 'success' as const },
          { icon: ArrowUp, text: t('headsUp.how.up'), tone: 'warning' as const },
        ].map(({ icon: Icon, text, tone }) => (
          <div key={text} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card p-3 text-center">
            <Badge tone={tone} className="size-10 justify-center rounded-full p-0">
              <Icon className="size-5" aria-hidden="true" />
            </Badge>
            <span className="text-xs leading-snug">{text}</span>
          </div>
        ))}
      </section>

      <section>
        <SectionHeader title={t('headsUp.packsTitle')} />
        <div className="grid grid-cols-2 gap-2 px-3" role="radiogroup" aria-label={t('headsUp.packsTitle')}>
          {[...WORD_PACKS.map((p) => ({ id: p.id as string, icon: p.icon, tint: p.tint, level: p.level, count: p.words.length })), { id: MIX_PACK, icon: Shuffle, tint: 5, level: null, count: null }].map((pack) => {
            const selected = saved.pack === pack.id
            const best = saved.best[pack.id]
            const name = pack.id === MIX_PACK ? t('headsUp.mix.name') : t(`headsUp.packs.${pack.id as 'food'}.name`)
            const hint = pack.id === MIX_PACK ? t('headsUp.mix.hint') : t(`headsUp.packs.${pack.id as 'food'}.hint`)
            const Icon = pack.icon
            return (
              <button
                key={pack.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => set({ pack: pack.id })}
                className={cn(
                  'flex min-h-28 flex-col items-start gap-1 rounded-2xl p-3 text-left transition-transform active:scale-[0.98]',
                  tintClass(pack.tint),
                  selected ? 'ring-3 ring-primary' : 'ring-0',
                )}
              >
                <span className="flex w-full items-center justify-between">
                  <Icon className="size-6" aria-hidden="true" />
                  {pack.level && <span className="rounded-full bg-background/60 px-2 py-0.5 text-[11px] font-medium">{t(`headsUp.levels.${pack.level}`)}</span>}
                </span>
                <span className="mt-1 text-sm font-medium">{name}</span>
                <span className="text-xs opacity-80">{hint}</span>
                <span className="mt-auto text-[11px] opacity-80">
                  {[pack.count !== null ? t('headsUp.wordsCount', { count: pack.count }) : null, best ? t('headsUp.best', { count: best }) : null].filter(Boolean).join(' · ')}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <SectionHeader title={t('headsUp.timeTitle')} />
        <div className="px-3">
          <SegmentedChoice<`${RoundSeconds}`>
            label={t('headsUp.timeTitle')}
            value={`${saved.seconds}`}
            onChange={(v) => set({ seconds: Number(v) as RoundSeconds })}
            options={[
              { value: '60', label: t('headsUp.seconds', { count: 60 }) },
              { value: '90', label: t('headsUp.seconds', { count: 90 }) },
            ]}
          />
        </div>
      </section>

      <section>
        <SectionHeader title={t('headsUp.optionsTitle')} />
        <Card className="mx-3 px-4 py-1">
          <ToggleRow
            title={t('headsUp.useTilt')}
            hint={tilt === 'unsupported' ? t('headsUp.tiltUnsupported') : tilt === 'denied' ? t('headsUp.tiltDenied') : t('headsUp.useTiltHint')}
            checked={tiltPossible && saved.useTilt}
            disabled={!tiltPossible}
            onChange={(on) => set({ useTilt: on })}
          />
          {tiltPossible && saved.useTilt && (
            <ToggleRow title={t('headsUp.inverted')} hint={t('headsUp.invertedHint')} checked={saved.inverted} onChange={(on) => set({ inverted: on })} />
          )}
          <ToggleRow title={t('headsUp.sound')} hint={t('headsUp.soundHint')} checked={saved.sound} onChange={(on) => set({ sound: on })} />
        </Card>
      </section>

      {/* One hero button in the thumb zone. */}
      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t bg-background/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur">
        <Button size="lg" className="w-full" onClick={onStart}>
          <Play data-icon="inline-start" />
          {t('headsUp.start')}
        </Button>
      </div>
    </div>
  )
}

function ToggleRow({ title, hint, checked, disabled, onChange }: { title: string; hint: string; checked: boolean; disabled?: boolean; onChange: (on: boolean) => void }) {
  return (
    <label className="flex min-h-14 items-center gap-3 py-2 [&+&]:border-t">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onChange} aria-label={title} />
    </label>
  )
}

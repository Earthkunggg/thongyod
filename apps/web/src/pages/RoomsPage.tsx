import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { DoorOpen, Plus, ScanLine, Smartphone, Wifi } from 'lucide-react'
import { isRoomCode } from '@/api/rooms'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ScanDialog } from '@/components/scan/ScanDialog'
import { GAMES } from '@/config/games'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { tintClass } from '@/lib/tones'
import { cn } from '@/lib/utils'

// /games/rooms — "เล่นหลายเครื่อง": create a room for a game, or join a friend's by code, QR or link (DECISIONS #76).
export function RoomsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [scan, setScan] = useState(false)
  const roomGames = GAMES.filter((g) => g.rooms && g.status === 'ready')

  function join(e: FormEvent) {
    e.preventDefault()
    if (isRoomCode(code)) void navigate(`/games/rooms/${code}`)
  }

  return (
    <div className="flex flex-col gap-2 pb-8">
      <PageHeader title={t('rooms.zoneTitle')} subtitle={t('rooms.zoneSubtitle')} backTo="/games" />

      <section className="px-3">
        <div className={cn('flex items-center gap-3 rounded-3xl p-4', tintClass(5))}>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-background/60">
            <Wifi className="size-6" aria-hidden="true" />
          </span>
          <p className="text-sm">{t('rooms.zoneIntro')}</p>
        </div>
      </section>

      <SectionHeader title={t('rooms.joinTitle')} />
      <form onSubmit={join} className="mx-3 flex flex-col gap-2 rounded-3xl border bg-card p-4">
        <label htmlFor="room-code" className="text-sm font-medium">
          {t('rooms.codeLabel')}
        </label>
        <div className="flex gap-2">
          <Input
            id="room-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="h-12 text-center text-2xl tracking-[0.4em] tabular-nums"
          />
          <Button type="submit" size="lg" className="h-12" disabled={!isRoomCode(code)}>
            <DoorOpen data-icon="inline-start" />
            {t('rooms.join')}
          </Button>
        </div>
        <Button type="button" variant="outline" onClick={() => setScan(true)}>
          <ScanLine data-icon="inline-start" />
          {t('rooms.scanQr')}
        </Button>
        <p className="text-xs text-muted-foreground">{t('rooms.joinHint')}</p>
      </form>

      <SectionHeader title={t('rooms.createTitle')} />
      <ul className="mx-3 grid gap-2">
        {roomGames.map((g) => (
          <li key={g.id}>
            <button
              type="button"
              onClick={() => void navigate(`/games/rooms/new?game=${g.id}`)}
              className={cn('flex w-full items-center gap-3 rounded-2xl p-4 text-left active:scale-[0.99]', tintClass(g.tint))}
            >
              <g.icon className="size-8 shrink-0" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{t(`games.list.${g.id}.title`)}</span>
                <span className="block text-xs opacity-80">{t(`games.list.${g.id}.desc`)}</span>
              </span>
              <Plus className="size-5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <p className="mx-4 mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        <Smartphone className="size-4 shrink-0" aria-hidden="true" />
        {t('rooms.moreSoon')}
      </p>

      <ScanDialog open={scan} onOpenChange={setScan} />
    </div>
  )
}

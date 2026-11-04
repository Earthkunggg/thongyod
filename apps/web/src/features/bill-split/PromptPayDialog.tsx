import { useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import QrScannerLib from 'qr-scanner'
import { ImageUp, Pencil, ScanLine, ShieldAlert } from 'lucide-react'
import { QrCodeCard } from '@/components/friends/QrCodeCard'
import { QrScanner } from '@/components/friends/QrScanner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatBaht } from '@/lib/money'
import { maskTarget, parseTarget, promptPayPayload, targetFromPayload, type PromptPayTarget } from '@/lib/promptpay'
import { TONE_CLASS } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { loadPromptPay, savePromptPay } from './promptPayStore'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Who receives the money (the QR is theirs). */
  payeeName: string
  payerName: string
  amountSatang: number
}

// PromptPay QR for one "ใครโอนให้ใคร" row (spec §9.1, no AI, no payment processing).
// The receiver's number: typed, scanned from their bank app QR (camera), or read from a QR picture.
export function PromptPayDialog({ open, onOpenChange, payeeName, payerName, amountSatang }: Props) {
  const { t } = useTranslation()
  const [target, setTarget] = useState<PromptPayTarget | null>(() => loadPromptPay(payeeName))
  const [editing, setEditing] = useState(target === null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={t('billSplit.promptPay.title', { name: payeeName })}
        description={editing ? t('billSplit.promptPay.setupHint', { name: payeeName }) : t('billSplit.promptPay.scanHint', { name: payerName })}
        className="max-h-[90dvh] overflow-y-auto"
      >
        {editing || !target ? (
          <TargetForm
            initial={target}
            onSave={(next) => {
              savePromptPay(payeeName, next)
              setTarget(next)
              setEditing(false)
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="text-3xl font-medium tabular-nums">{formatBaht(amountSatang)}</p>
            <QrCodeCard value={promptPayPayload(target, amountSatang)} label={t('billSplit.promptPay.qrLabel', { name: payeeName, amount: formatBaht(amountSatang) })} />
            <p className="text-sm text-muted-foreground">
              {t('billSplit.promptPay.to', { name: payeeName, id: maskTarget(target) })}
            </p>
            {target.type === 'nationalId' && <NationalIdWarning />}
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil data-icon="inline-start" />
              {t('billSplit.promptPay.change')}
            </Button>
            <p className="text-center text-xs text-muted-foreground">{t('billSplit.promptPay.noCheck')}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function NationalIdWarning() {
  const { t } = useTranslation()
  return (
    <p className={cn('flex items-start gap-2 rounded-lg p-2 text-xs', TONE_CLASS.warning)}>
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {t('billSplit.promptPay.idWarning')}
    </p>
  )
}

function TargetForm({ initial, onSave }: { initial: PromptPayTarget | null; onSave: (target: PromptPayTarget) => void }) {
  const { t } = useTranslation()
  const [raw, setRaw] = useState(initial?.value ?? '')
  const [problem, setProblem] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const file = useRef<HTMLInputElement>(null)
  const parsed = parseTarget(raw)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (parsed) onSave(parsed)
    else setProblem(t('billSplit.promptPay.invalid'))
  }

  function fromQrText(text: string): boolean {
    const found = targetFromPayload(text)
    if (!found) {
      setProblem(t('billSplit.promptPay.notPromptPay'))
      return false
    }
    setScanning(false)
    setRaw(found.value)
    setProblem(null)
    return true
  }

  async function fromImage(picked: File | undefined) {
    if (!picked) return
    try {
      const result = await QrScannerLib.scanImage(picked, { returnDetailedScanResult: true })
      fromQrText(result.data)
    } catch {
      setProblem(t('billSplit.promptPay.noQrInImage'))
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {scanning ? (
        <QrScanner onRead={fromQrText} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={() => setScanning(true)}>
            <ScanLine data-icon="inline-start" />
            {t('billSplit.promptPay.scan')}
          </Button>
          <Button type="button" variant="outline" onClick={() => file.current?.click()}>
            <ImageUp data-icon="inline-start" />
            {t('billSplit.promptPay.fromImage')}
          </Button>
          <input ref={file} type="file" accept="image/*" hidden onChange={(e) => void fromImage(e.target.files?.[0])} />
        </div>
      )}
      <Input
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value)
          setProblem(null)
        }}
        inputMode="numeric"
        autoComplete="off"
        placeholder={t('billSplit.promptPay.placeholder')}
        aria-label={t('billSplit.promptPay.label')}
        aria-invalid={problem !== null}
      />
      {problem && (
        <p className="text-xs text-destructive" role="alert">
          {problem}
        </p>
      )}
      {parsed?.type === 'nationalId' && <NationalIdWarning />}
      <Button type="submit" disabled={raw.trim() === ''}>
        {t('billSplit.promptPay.save')}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t('billSplit.promptPay.onDevice')}</p>
    </form>
  )
}

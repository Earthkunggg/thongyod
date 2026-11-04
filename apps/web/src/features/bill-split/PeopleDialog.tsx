import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Cake, Plus, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { addPerson, canTreat, MAX_NAME_LENGTH, MAX_PEOPLE, removePerson, renamePerson, soloEntries, toggleTreated, type Bill } from './bill'
import { Face } from './Faces'
import { usePersonName } from './names'

type Props = { bill: Bill; open: boolean; onOpenChange: (open: boolean) => void; onChange: (change: (bill: Bill) => Bill) => void }

// Who is in this bill: add, rename, remove, and "เลี้ยงทั้งบิล" (birthday: pays nothing).
export function PeopleDialog({ bill, open, onOpenChange, onChange }: Props) {
  const { t } = useTranslation()
  const nameOf = usePersonName(bill)
  const [name, setName] = useState('')
  const [removing, setRemoving] = useState<string | null>(null)
  const full = bill.people.length >= MAX_PEOPLE

  function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onChange((b) => addPerson(b, name))
    setName('')
  }

  function askRemove(id: string) {
    if (soloEntries(bill, id).length > 0) setRemoving(id)
    else onChange((b) => removePerson(b, id))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent title={t('billSplit.people')} description={t('billSplit.treatAllHint')} className="max-h-[85dvh] overflow-y-auto">
          <ul className="flex flex-col gap-2">
            {bill.people.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2">
                <Face bill={bill} id={p.id} className="size-9 text-sm" />
                <Input
                  value={p.name}
                  maxLength={MAX_NAME_LENGTH}
                  placeholder={t('billSplit.personN', { n: i + 1 })}
                  aria-label={t('billSplit.personN', { n: i + 1 })}
                  className="min-w-0"
                  onChange={(e) => onChange((b) => renamePerson(b, p.id, e.target.value))}
                />
                <button
                  type="button"
                  aria-pressed={p.treated}
                  aria-label={t('billSplit.treatAllNamed', { name: nameOf(p.id) })}
                  disabled={!canTreat(bill, p.id)}
                  onClick={() => onChange((b) => toggleTreated(b, p.id))}
                  className={cn(
                    'grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors disabled:opacity-30',
                    p.treated ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted/60 text-muted-foreground',
                  )}
                >
                  <Cake className="size-4" />
                </button>
                {bill.people.length > 1 && (
                  <Button variant="ghost" size="icon" aria-label={t('billSplit.removePerson', { name: nameOf(p.id) })} onClick={() => askRemove(p.id)}>
                    <X />
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={add} className="flex gap-2">
            <Input
              value={name}
              maxLength={MAX_NAME_LENGTH}
              disabled={full}
              placeholder={full ? t('billSplit.peopleFull', { max: MAX_PEOPLE }) : t('billSplit.addPerson')}
              aria-label={t('billSplit.addPerson')}
              className="min-w-0"
              onChange={(e) => setName(e.target.value)}
            />
            <Button type="submit" variant="outline" size="icon" disabled={full || !name.trim()} aria-label={t('billSplit.addPerson')}>
              <Plus />
            </Button>
          </form>
          <Button onClick={() => onOpenChange(false)}>{t('billSplit.done')}</Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={t('billSplit.removePersonTitle', { name: removing ? nameOf(removing) : '' })}
        description={t('billSplit.removePersonText', { count: removing ? soloEntries(bill, removing).length : 0 })}
        confirmLabel={t('billSplit.remove')}
        destructive
        onConfirm={() => {
          if (removing) onChange((b) => removePerson(b, removing))
          setRemoving(null)
        }}
      />
    </>
  )
}

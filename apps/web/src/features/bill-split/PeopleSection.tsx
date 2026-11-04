import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { personColor } from './colors'
import { addPerson, removePerson, renamePerson, toggleTreat, type BillDraft } from './draft'
import { MAX_NAME_LENGTH, MAX_PEOPLE, MIN_PEOPLE } from './logic'

type Props = { draft: BillDraft; onChange: (draft: BillDraft) => void }

// Who is at the table: name, who paid (💰) and who is treated (🎂).
export function PeopleSection({ draft, onChange }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const full = draft.people.length >= MAX_PEOPLE

  function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onChange(addPerson(draft, name))
    setName('')
  }

  return (
    <section className="flex flex-col gap-2" aria-labelledby="bill-people">
      <div className="flex items-baseline justify-between">
        <h2 id="bill-people" className="text-sm font-medium">
          {t('billSplit.people')}
        </h2>
        <span className="text-xs text-muted-foreground">{t('billSplit.legend')}</span>
      </div>

      <ul className="flex flex-col gap-2">
        {draft.people.map((person, i) => {
          const label = person.trim() || t('billSplit.personN', { n: i + 1 })
          const isPayer = draft.payer === i
          const isTreated = draft.treated.includes(i)
          return (
            <li key={i} className="flex items-center gap-2">
              <Avatar name={label} className={personColor(i)} />
              <Input
                value={person}
                maxLength={MAX_NAME_LENGTH}
                placeholder={t('billSplit.personN', { n: i + 1 })}
                aria-label={t('billSplit.personN', { n: i + 1 })}
                onChange={(e) => onChange(renamePerson(draft, i, e.target.value))}
              />
              <IconToggle
                pressed={isPayer}
                label={t('billSplit.setPayer', { name: label })}
                onClick={() => onChange({ ...draft, payer: i, treated: draft.treated.filter((p) => p !== i) })}
              >
                💰
              </IconToggle>
              <IconToggle
                pressed={isTreated}
                label={t('billSplit.setTreat', { name: label })}
                onClick={() => onChange(toggleTreat(draft, i))}
              >
                🎂
              </IconToggle>
              {draft.people.length > MIN_PEOPLE && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('billSplit.removePerson', { name: label })}
                  onClick={() => onChange(removePerson(draft, i))}
                >
                  <X />
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <form onSubmit={add} className="flex gap-2">
        <Input
          value={name}
          maxLength={MAX_NAME_LENGTH}
          disabled={full}
          placeholder={full ? t('billSplit.peopleFull', { max: MAX_PEOPLE }) : t('billSplit.addPerson')}
          aria-label={t('billSplit.addPerson')}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" variant="outline" size="icon" disabled={full || !name.trim()} aria-label={t('billSplit.addPerson')}>
          <Plus />
        </Button>
      </form>
    </section>
  )
}

function IconToggle({ pressed, label, onClick, children }: { pressed: boolean; label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-lg transition-[opacity,transform] active:scale-90',
        pressed ? 'bg-primary/15 ring-2 ring-primary' : 'opacity-35 grayscale',
      )}
    >
      {children}
    </button>
  )
}

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Cake, Plus, Wallet, X } from 'lucide-react'
import { Avatar } from '@/components/common/Avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { personColor } from './colors'
import { addPerson, removePerson, renamePerson, toggleTreat, type BillDraft } from './draft'
import { MAX_NAME_LENGTH, MAX_PEOPLE, MIN_PEOPLE } from './logic'
import { PersonChip } from './PersonChip'

type Props = { draft: BillDraft; onChange: (draft: BillDraft) => void }

// Who is at the table, then two clear pickers: who paid the restaurant, and who is treated.
export function PeopleSection({ draft, onChange }: Props) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const full = draft.people.length >= MAX_PEOPLE
  const nameOf = (i: number) => draft.people[i].trim() || t('billSplit.personN', { n: i + 1 })
  // Someone has to pay: when only one person is not treated, they cannot be treated too.
  const lastPayer = draft.treated.length >= draft.people.length - 1

  function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onChange(addPerson(draft, name))
    setName('')
  }

  return (
    <>
      <section className="flex flex-col gap-2" aria-labelledby="bill-people">
        <h2 id="bill-people" className="text-sm font-medium">
          {t('billSplit.people')}
        </h2>
        <ul className="flex flex-col gap-2">
          {draft.people.map((person, i) => (
            <li key={i} className="flex items-center gap-2">
              <Avatar name={nameOf(i)} className={personColor(i)} />
              <Input
                value={person}
                maxLength={MAX_NAME_LENGTH}
                placeholder={t('billSplit.personN', { n: i + 1 })}
                aria-label={t('billSplit.personN', { n: i + 1 })}
                className="min-w-0"
                onChange={(e) => onChange(renamePerson(draft, i, e.target.value))}
              />
              {draft.people.length > MIN_PEOPLE && (
                <Button variant="ghost" size="icon" aria-label={t('billSplit.removePerson', { name: nameOf(i) })} onClick={() => onChange(removePerson(draft, i))}>
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
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="bill-payer">
        <h2 id="bill-payer" className="flex items-center gap-1.5 text-sm font-medium">
          <Wallet className="size-4 text-muted-foreground" aria-hidden="true" />
          {t('billSplit.whoPaid')}
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="bill-payer">
          {draft.people.map((_, i) => (
            <PersonChip key={i} index={i} name={nameOf(i)} icon={Wallet} pressed={draft.payer === i} onClick={() => onChange({ ...draft, payer: i })} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="bill-treat">
        <h2 id="bill-treat" className="flex items-center gap-1.5 text-sm font-medium">
          <Cake className="size-4 text-muted-foreground" aria-hidden="true" />
          {t('billSplit.whoTreated')}
        </h2>
        <p className="-mt-1 text-xs text-muted-foreground">{lastPayer ? t('billSplit.treatLimit') : t('billSplit.treatHint')}</p>
        <div className="flex flex-wrap gap-2">
          {draft.people.map((_, i) => {
            const on = draft.treated.includes(i)
            return (
              <PersonChip
                key={i}
                index={i}
                name={nameOf(i)}
                icon={Cake}
                pressed={on}
                disabled={!on && lastPayer}
                onClick={() => onChange(toggleTreat(draft, i))}
              />
            )
          })}
        </div>
      </section>
    </>
  )
}

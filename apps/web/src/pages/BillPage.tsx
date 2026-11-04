import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Ellipsis, Pencil, Trash2, UserPlus } from 'lucide-react'
import { ActionSheet } from '@/components/common/ActionSheet'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { SegmentedChoice } from '@/components/common/SegmentedChoice'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { MAX_TITLE_LENGTH, type Bill } from '@/features/bill-split/bill'
import { Faces } from '@/features/bill-split/Faces'
import { JotTab } from '@/features/bill-split/JotTab'
import { PeopleDialog } from '@/features/bill-split/PeopleDialog'
import { SplitTab } from '@/features/bill-split/SplitTab'
import { deleteBill, updateBill, useBill } from '@/features/bill-split/storage'

type Tab = 'jot' | 'split'

// One bill: "จด" while eating, "หาร" to settle (DECISIONS #53).
export function BillPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const bill = useBill(id)
  const [tab, setTab] = useState<Tab>('jot')
  // A brand-new bill only has "ฉัน": open the people list first.
  const [people, setPeople] = useState(() => !!bill && bill.people.length === 1 && bill.entries.length === 0)
  const [menu, setMenu] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (!bill) {
    return (
      <>
        <PageHeader title={t('billSplit.title')} backTo="/bills" />
        <div className="px-4">
          <EmptyState
            title={t('billSplit.notFound')}
            action={
              <Link to="/bills" className={buttonVariants({ variant: 'outline' })}>
                {t('billSplit.backToBills')}
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const change = (fn: (b: Bill) => Bill) => updateBill(bill.id, fn)

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title={bill.title}
        backTo="/bills"
        action={
          <Button variant="ghost" size="icon" aria-label={t('billSplit.more')} onClick={() => setMenu(true)}>
            <Ellipsis />
          </Button>
        }
      />
      <div className="flex flex-1 flex-col gap-4 px-4">
        <button type="button" onClick={() => setPeople(true)} className="flex items-center gap-2 rounded-xl border bg-card p-2 pl-3 text-left active:bg-muted/50">
          <Faces bill={bill} ids={bill.people.map((p) => p.id)} />
          <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{t('billSplit.peopleCount', { count: bill.people.length })}</span>
          <span className="flex items-center gap-1 text-sm text-primary">
            <UserPlus className="size-4" aria-hidden="true" />
            {t('billSplit.managePeople')}
          </span>
        </button>

        <SegmentedChoice<Tab>
          label={t('billSplit.tabs')}
          value={tab}
          onChange={setTab}
          options={[
            { value: 'jot', label: t('billSplit.tabJot', { count: bill.entries.length }) },
            { value: 'split', label: t('billSplit.tabSplit') },
          ]}
        />

        {tab === 'jot' ? <JotTab bill={bill} onChange={change} /> : <SplitTab bill={bill} onChange={change} />}
      </div>

      <PeopleDialog bill={bill} open={people} onOpenChange={setPeople} onChange={change} />

      <ActionSheet
        open={menu}
        onOpenChange={setMenu}
        title={bill.title}
        actions={[
          { key: 'rename', label: t('billSplit.rename'), icon: Pencil, onSelect: () => setRenaming(true) },
          { key: 'delete', label: t('billSplit.deleteBill'), icon: Trash2, destructive: true, onSelect: () => setDeleting(true) },
        ]}
      />
      {renaming && <RenameDialog title={bill.title} onClose={() => setRenaming(false)} onSave={(title) => change((b) => ({ ...b, title }))} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('billSplit.deleteBillTitle')}
        description={t('billSplit.deleteBillText')}
        confirmLabel={t('billSplit.deleteBill')}
        destructive
        onConfirm={() => {
          deleteBill(bill.id)
          void navigate('/bills', { replace: true })
        }}
      />
    </div>
  )
}

function RenameDialog({ title, onClose, onSave }: { title: string; onClose: () => void; onSave: (title: string) => void }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(title)
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={t('billSplit.rename')}>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!value.trim()) return
            onSave(value.trim())
            onClose()
          }}
        >
          <Input value={value} maxLength={MAX_TITLE_LENGTH} aria-label={t('billSplit.billTitle')} onChange={(e) => setValue(e.target.value)} autoFocus />
          <Button type="submit" disabled={!value.trim()}>
            {t('billSplit.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

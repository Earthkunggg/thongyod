// The bill being edited (what the form holds). Pure functions: no React, no DOM.
import { MAX_ITEMS, MAX_NAME_LENGTH, MAX_PEOPLE, MIN_PEOPLE, computeSplit, parseBaht, type Item, type SplitResult } from './logic'

export type DraftItem = { name: string; priceText: string; eaters: number[] }

export type BillDraft = {
  people: string[]
  /** Who paid the restaurant (gets the money back). */
  payer: number
  /** "เลี้ยง": these people pay nothing. */
  treated: number[]
  mode: 'equal' | 'items'
  totalText: string
  items: DraftItem[]
  /** Ticked on the receipt as "จ่ายแล้ว". */
  paid: number[]
}

export function newDraft(me: string, friend: string): BillDraft {
  return { people: [me, friend], payer: 0, treated: [], mode: 'equal', totalText: '', items: [emptyItem()], paid: [] }
}

export function emptyItem(): DraftItem {
  return { name: '', priceText: '', eaters: [] }
}

export function addPerson(draft: BillDraft, name: string): BillDraft {
  const clean = name.trim().slice(0, MAX_NAME_LENGTH)
  if (!clean || draft.people.length >= MAX_PEOPLE) return draft
  return { ...draft, people: [...draft.people, clean] }
}

export function renamePerson(draft: BillDraft, index: number, name: string): BillDraft {
  return { ...draft, people: draft.people.map((p, i) => (i === index ? name.slice(0, MAX_NAME_LENGTH) : p)) }
}

/** Removes a person and fixes every index that points at people (payer, treated, eaters, paid). */
export function removePerson(draft: BillDraft, index: number): BillDraft {
  if (draft.people.length <= MIN_PEOPLE || index < 0 || index >= draft.people.length) return draft
  const shift = (list: number[]) => list.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i))
  return {
    ...draft,
    people: draft.people.filter((_, i) => i !== index),
    payer: draft.payer === index ? 0 : draft.payer > index ? draft.payer - 1 : draft.payer,
    treated: shift(draft.treated),
    paid: shift(draft.paid),
    items: draft.items.map((item) => ({ ...item, eaters: shift(item.eaters) })),
  }
}

export function toggle(list: number[], value: number): number[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value].sort((a, b) => a - b)
}

/** Treat someone; never lets everyone be treated (someone has to pay). */
export function toggleTreat(draft: BillDraft, index: number): BillDraft {
  const treated = toggle(draft.treated, index)
  if (treated.length >= draft.people.length) return draft
  return { ...draft, treated }
}

export function addItem(draft: BillDraft): BillDraft {
  if (draft.items.length >= MAX_ITEMS) return draft
  return { ...draft, items: [...draft.items, emptyItem()] }
}

export function updateItem(draft: BillDraft, index: number, patch: Partial<DraftItem>): BillDraft {
  return { ...draft, items: draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) }
}

export function removeItem(draft: BillDraft, index: number): BillDraft {
  const items = draft.items.filter((_, i) => i !== index)
  return { ...draft, items: items.length > 0 ? items : [emptyItem()] }
}

export type DraftCheck = {
  result: SplitResult | null
  /** Items whose price is filled in but not a valid amount. */
  badItems: number[]
  totalInvalid: boolean
}

/** Works out the split from the form. Empty prices are skipped; invalid ones are reported. */
export function checkDraft(draft: BillDraft): DraftCheck {
  const people = draft.people.length
  if (draft.mode === 'equal') {
    const total = parseBaht(draft.totalText)
    const totalInvalid = draft.totalText.trim() !== '' && total === null
    if (total === null || total === 0) return { result: null, badItems: [], totalInvalid }
    return { result: computeSplit({ mode: 'equal', people, total, treated: draft.treated }), badItems: [], totalInvalid: false }
  }
  const badItems: number[] = []
  const items: Item[] = []
  draft.items.forEach((item, i) => {
    if (item.priceText.trim() === '') return
    const price = parseBaht(item.priceText)
    if (price === null) badItems.push(i)
    else items.push({ name: item.name, price, eaters: item.eaters })
  })
  if (items.length === 0 || items.every((i) => i.price === 0)) return { result: null, badItems, totalInvalid: false }
  return { result: computeSplit({ mode: 'items', people, items, treated: draft.treated }), badItems, totalInvalid: false }
}

/** Shape check for a draft read back from storage. */
export function isBillDraft(value: unknown): value is BillDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as BillDraft
  const isIndexList = (list: unknown) => Array.isArray(list) && list.every((i) => Number.isInteger(i) && i >= 0 && i < d.people.length)
  return (
    Array.isArray(d.people) &&
    d.people.length >= MIN_PEOPLE &&
    d.people.length <= MAX_PEOPLE &&
    d.people.every((p) => typeof p === 'string') &&
    Number.isInteger(d.payer) &&
    d.payer >= 0 &&
    d.payer < d.people.length &&
    isIndexList(d.treated) &&
    isIndexList(d.paid) &&
    (d.mode === 'equal' || d.mode === 'items') &&
    typeof d.totalText === 'string' &&
    Array.isArray(d.items) &&
    d.items.every((i) => typeof i?.name === 'string' && typeof i.priceText === 'string' && isIndexList(i.eaters))
  )
}

/** Payer and treated people never owe anything, so they count as paid. */
export function isSettled(draft: BillDraft, index: number): boolean {
  return index === draft.payer || draft.treated.includes(index) || draft.paid.includes(index)
}

export function allSettled(draft: BillDraft): boolean {
  return draft.people.every((_, i) => isSettled(draft, i))
}

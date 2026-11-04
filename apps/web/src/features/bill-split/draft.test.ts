import { describe, expect, it } from 'vitest'
import { addPerson, checkDraft, isBillDraft, newDraft, removePerson, toggleTreat, updateItem, type BillDraft } from './draft'

const three = (): BillDraft => addPerson(newDraft('ฉัน', 'เอ'), 'บี')

describe('people', () => {
  it('adds trimmed names and ignores blanks', () => {
    expect(three().people).toEqual(['ฉัน', 'เอ', 'บี'])
    expect(addPerson(three(), '   ').people).toHaveLength(3)
  })
  it('removing a person fixes payer, treated, paid and eaters', () => {
    let d = three()
    d = { ...d, payer: 2, treated: [1], paid: [0, 2] }
    d = updateItem(d, 0, { priceText: '90', eaters: [0, 1, 2] })
    const r = removePerson(d, 1)
    expect(r.people).toEqual(['ฉัน', 'บี'])
    expect(r.payer).toBe(1)
    expect(r.treated).toEqual([])
    expect(r.paid).toEqual([0, 1])
    expect(r.items[0].eaters).toEqual([0, 1])
  })
  it('removing the payer makes the first person pay', () => {
    expect(removePerson({ ...three(), payer: 1 }, 1).payer).toBe(0)
  })
  it('keeps at least 2 people', () => {
    expect(removePerson(newDraft('ฉัน', 'เอ'), 0).people).toHaveLength(2)
  })
  it('never treats everyone', () => {
    const d = toggleTreat(newDraft('ฉัน', 'เอ'), 0)
    expect(d.treated).toEqual([0])
    expect(toggleTreat(d, 1).treated).toEqual([0])
  })
})

describe('checkDraft', () => {
  it('equal mode: empty is not an error, junk is', () => {
    expect(checkDraft(three()).result).toBe(null)
    expect(checkDraft({ ...three(), totalText: 'abc' }).totalInvalid).toBe(true)
    expect(checkDraft({ ...three(), totalText: '1000' }).result?.amounts).toEqual([33400, 33400, 33400])
  })
  it('items mode: skips empty prices and reports bad ones', () => {
    let d: BillDraft = { ...three(), mode: 'items' }
    d = updateItem(d, 0, { priceText: '300', eaters: [0] })
    d = { ...d, items: [...d.items, { name: '', priceText: '', eaters: [] }, { name: '', priceText: '1.234', eaters: [] }] }
    const r = checkDraft(d)
    expect(r.badItems).toEqual([2])
    expect(r.result?.amounts).toEqual([30000, 0, 0])
  })
})

describe('isBillDraft', () => {
  it('accepts a real draft and rejects broken data', () => {
    expect(isBillDraft(three())).toBe(true)
    expect(isBillDraft({ ...three(), payer: 9 })).toBe(false)
    expect(isBillDraft({ ...three(), people: ['x'] })).toBe(false)
    expect(isBillDraft(null)).toBe(false)
  })
})

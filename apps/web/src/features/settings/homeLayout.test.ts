import { describe, expect, it } from 'vitest'
import { DEFAULT_HOME_SECTIONS } from '@/config/home'
import { moveSection, toggleSection, type HomeLayout } from './homeLayout'

const base: HomeLayout = { order: [...DEFAULT_HOME_SECTIONS], hidden: [] }

describe('home layout', () => {
  it('moves a section up and down', () => {
    expect(moveSection(base, 'agenda', -1).order.slice(0, 2)).toEqual(['agenda', 'waiting'])
    expect(moveSection(base, 'waiting', 1).order.slice(0, 2)).toEqual(['agenda', 'waiting'])
  })
  it('does nothing past the ends', () => {
    expect(moveSection(base, 'waiting', -1)).toBe(base)
    expect(moveSection(base, 'feed', 1)).toBe(base)
  })
  it('hides and shows without duplicates', () => {
    const hidden = toggleSection(toggleSection(base, 'feed', false), 'feed', false)
    expect(hidden.hidden).toEqual(['feed'])
    expect(toggleSection(hidden, 'feed', true).hidden).toEqual([])
  })
})

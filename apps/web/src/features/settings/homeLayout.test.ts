import { describe, expect, it } from 'vitest'
import { DEFAULT_HOME_SECTIONS } from '@/config/home'
import { moveSection, normalizeHomeLayout, toggleSection, type HomeLayout } from './homeLayout'

const base: HomeLayout = { order: [...DEFAULT_HOME_SECTIONS], hidden: [] }

describe('home layout', () => {
  it('moves a zone up and down', () => {
    expect(moveSection(base, 'friends', -1).order.slice(0, 2)).toEqual(['friends', 'today'])
    expect(moveSection(base, 'today', 1).order.slice(0, 2)).toEqual(['friends', 'today'])
  })
  it('does nothing past the ends', () => {
    expect(moveSection(base, 'today', -1)).toBe(base)
    expect(moveSection(base, 'tools', 1)).toBe(base)
  })
  it('hides and shows without duplicates', () => {
    const hidden = toggleSection(toggleSection(base, 'friends', false), 'friends', false)
    expect(hidden.hidden).toEqual(['friends'])
    expect(toggleSection(hidden, 'friends', true).hidden).toEqual([])
  })
  it('a layout saved by the old 8-section Home loads as the 4 zones (old ids dropped)', () => {
    const old = { order: ['feed', 'waiting', 'highlights', 'tools', 'missions', 'agenda', 'pending', 'discover'], hidden: ['discover', 'tools'] }
    expect(normalizeHomeLayout(old)).toEqual({ order: ['today', 'friends', 'pet', 'tools'], hidden: ['tools'] })
  })
})

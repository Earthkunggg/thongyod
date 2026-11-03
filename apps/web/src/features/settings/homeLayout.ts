// Which Home sections are shown, and in what order (decision #35).
// Saved on this device until the preferences API exists; then it moves to the server.
import { useSyncExternalStore } from 'react'
import { DEFAULT_HOME_SECTIONS, type HomeSectionId } from '@/config/home'

export type HomeLayout = { order: HomeSectionId[]; hidden: HomeSectionId[] }

const STORAGE_KEY = 'thongyod-home-layout'
const DEFAULT_LAYOUT: HomeLayout = { order: DEFAULT_HOME_SECTIONS, hidden: [] }
const listeners = new Set<() => void>()
let cached: HomeLayout | null = null

/** Keeps only known ids, adds new sections at the end (so app updates never lose a card). */
function normalize(value: unknown): HomeLayout {
  const known = new Set<string>(DEFAULT_HOME_SECTIONS)
  const raw = (value ?? {}) as Partial<HomeLayout>
  const order = (Array.isArray(raw.order) ? raw.order : []).filter((id): id is HomeSectionId => known.has(id))
  const unique = [...new Set(order)]
  const missing = DEFAULT_HOME_SECTIONS.filter((id) => !unique.includes(id))
  const hidden = (Array.isArray(raw.hidden) ? raw.hidden : []).filter((id): id is HomeSectionId => known.has(id))
  return { order: [...unique, ...missing], hidden: [...new Set(hidden)] }
}

export function getHomeLayout(): HomeLayout {
  if (cached) return cached
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    cached = stored ? normalize(JSON.parse(stored)) : DEFAULT_LAYOUT
  } catch {
    cached = DEFAULT_LAYOUT
  }
  return cached
}

export function setHomeLayout(layout: HomeLayout): void {
  cached = normalize(layout)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
  } catch {
    // Storage blocked: the change still applies until the page reloads.
  }
  listeners.forEach((listener) => listener())
}

export function useHomeLayout(): HomeLayout {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getHomeLayout,
  )
}

/** Move a section one step up (-1) or down (+1). */
export function moveSection(layout: HomeLayout, id: HomeSectionId, step: -1 | 1): HomeLayout {
  const order = [...layout.order]
  const from = order.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= order.length) return layout
  ;[order[from], order[to]] = [order[to], order[from]]
  return { ...layout, order }
}

export function toggleSection(layout: HomeLayout, id: HomeSectionId, visible: boolean): HomeLayout {
  const hidden = visible ? layout.hidden.filter((x) => x !== id) : [...new Set([...layout.hidden, id])]
  return { ...layout, hidden }
}

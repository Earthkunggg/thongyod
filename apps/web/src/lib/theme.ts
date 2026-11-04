// Theme ("ค่าเริ่มต้น" / "น่ารัก") is a user choice saved on this device.
// Light/dark mode: "system" (default) follows the device; "light"/"dark" are saved choices.
// index.html applies both before the first paint; keep the storage keys in sync with it.
export type Theme = 'default' | 'cute'

const STORAGE_KEY = 'thongyod-theme'

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'cute' ? 'cute' : 'default'
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Storage can be blocked (private mode). The theme still applies for this visit.
  }
}

export type Mode = 'system' | 'light' | 'dark'

const MODE_KEY = 'thongyod-mode'

export function getMode(): Mode {
  try {
    const saved = localStorage.getItem(MODE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export function setMode(mode: Mode): void {
  try {
    if (mode === 'system') localStorage.removeItem(MODE_KEY)
    else localStorage.setItem(MODE_KEY, mode)
  } catch {
    // Storage blocked: the mode still applies for this visit.
  }
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.mode = dark ? 'dark' : 'light'
}

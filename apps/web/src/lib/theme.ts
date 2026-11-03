// Theme ("ค่าเริ่มต้น" / "น่ารัก") is a user choice saved on this device.
// Light/dark mode is NOT stored: it follows the device setting (see index.html).
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

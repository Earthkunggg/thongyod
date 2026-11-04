// Tab pages (Home, Gangs/Friends, Pet, Me) normally have no back button: you reach them from the tab bar.
// When another page links INTO a tab page (e.g. "สัตว์เลี้ยง" on ทำอะไรดี, the friends count on a profile),
// pass this state so the page shows a back button (PageHeader reads it).
export const SHOW_BACK = { showBack: true } as const

export function wantsBack(state: unknown): boolean {
  return typeof state === 'object' && state !== null && (state as { showBack?: unknown }).showBack === true
}

/** Link to a person's profile: my own tab for me, /u/:id for others. */
export function profileLink(userId: string, myId: string | undefined): string {
  return userId === myId ? '/me' : `/u/${userId}`
}

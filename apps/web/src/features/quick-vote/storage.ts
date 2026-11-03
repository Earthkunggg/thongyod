// Keeps an unfinished vote on this device, so closing the app by mistake does not lose votes.
// Cleared when the vote is decided or a new vote starts.
import type { QuickVoteSession } from './logic'

const KEY = 'thongyod-quick-vote'

export function loadSession(): QuickVoteSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as QuickVoteSession
    // Minimal shape check; anything odd is discarded.
    if (!Array.isArray(s.options) || !Array.isArray(s.ballots) || !Array.isArray(s.candidates)) return null
    return s.phase === 'decided' ? null : s
  } catch {
    return null
  }
}

export function saveSession(session: QuickVoteSession | null): void {
  try {
    if (session && session.phase !== 'decided') localStorage.setItem(KEY, JSON.stringify(session))
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked (private mode): the vote still works, it just is not kept.
  }
}

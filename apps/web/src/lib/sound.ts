// Tiny game sounds made with Web Audio (no files, no library). UX_GUIDELINES §5:
// short, one soft style, never the only signal. The iPhone silent switch mutes Web Audio by default,
// and we never change navigator.audioSession, so silent stays silent.
// Browsers start audio only after a tap: call unlockSound() from the "start" button.

export type SoundName = 'tick' | 'countdown' | 'go' | 'correct' | 'pass' | 'end' | 'pop'

let context: AudioContext | null = null

function ctx(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  context ??= new AudioContext()
  return context
}

/** Call from a tap (start button) so later sounds can play. Safe to call many times. */
export function unlockSound(): void {
  const c = ctx()
  if (c && c.state === 'suspended') void c.resume()
}

type Note = { freq: number; at: number; dur: number; type?: OscillatorType; gain?: number; slideTo?: number }

const SOUNDS: Record<SoundName, Note[]> = {
  tick: [{ freq: 1200, at: 0, dur: 0.04, type: 'square', gain: 0.05 }],
  countdown: [{ freq: 660, at: 0, dur: 0.12, type: 'triangle', gain: 0.18 }],
  go: [{ freq: 990, at: 0, dur: 0.25, type: 'triangle', gain: 0.2 }],
  // Rising "ding-ding".
  correct: [
    { freq: 784, at: 0, dur: 0.1, type: 'triangle', gain: 0.18 },
    { freq: 1175, at: 0.09, dur: 0.18, type: 'triangle', gain: 0.18 },
  ],
  // Soft falling "whoop".
  pass: [{ freq: 440, at: 0, dur: 0.22, type: 'sine', gain: 0.16, slideTo: 260 }],
  end: [
    { freq: 523, at: 0, dur: 0.14, type: 'triangle', gain: 0.18 },
    { freq: 659, at: 0.13, dur: 0.14, type: 'triangle', gain: 0.18 },
    { freq: 784, at: 0.26, dur: 0.3, type: 'triangle', gain: 0.18 },
  ],
  pop: [{ freq: 600, at: 0, dur: 0.08, type: 'sine', gain: 0.14, slideTo: 900 }],
}

/** Plays a short sound. Does nothing when audio is not available or still locked. */
export function playSound(name: SoundName, volume = 1): void {
  const c = ctx()
  if (!c || c.state !== 'running' || volume <= 0) return
  const start = c.currentTime
  for (const note of SOUNDS[name]) {
    const osc = c.createOscillator()
    const amp = c.createGain()
    osc.type = note.type ?? 'sine'
    osc.frequency.setValueAtTime(note.freq, start + note.at)
    if (note.slideTo) osc.frequency.exponentialRampToValueAtTime(note.slideTo, start + note.at + note.dur)
    const peak = (note.gain ?? 0.15) * volume
    amp.gain.setValueAtTime(0.0001, start + note.at)
    amp.gain.exponentialRampToValueAtTime(peak, start + note.at + 0.01)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.dur)
    osc.connect(amp).connect(c.destination)
    osc.start(start + note.at)
    osc.stop(start + note.at + note.dur + 0.02)
  }
}

/** Short vibration on Android (iPhone browsers cannot vibrate). Never required for meaning (UX §6). */
export function buzz(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // Some browsers throw when vibration is blocked; ignore.
  }
}

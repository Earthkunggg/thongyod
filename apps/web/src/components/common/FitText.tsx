import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type FitTextProps = {
  text: string
  /** Largest and smallest font size in px. */
  max: number
  min?: number
  /** Most lines allowed before shrinking further. */
  maxLines?: number
  className?: string
}

// The biggest font size (between min and max) at which `text` fits its box in at most `maxLines` lines.
// Re-measures when the box changes size (rotation, iPad split view). Thai line-height 1.25 for big words.
export function FitText({ text, max, min = 24, maxLines = 2, className }: FitTextProps) {
  const box = useRef<HTMLDivElement>(null)
  const probe = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState(max)

  useLayoutEffect(() => {
    const outer = box.current
    const inner = probe.current
    if (!outer || !inner) return
    const fit = () => {
      const width = outer.clientWidth
      const height = outer.clientHeight
      let lo = min
      let hi = max
      // Binary search on the probe (same font, invisible).
      for (let i = 0; i < 12; i++) {
        const mid = (lo + hi) / 2
        inner.style.fontSize = `${mid}px`
        const lineHeight = mid * 1.25
        const fits = inner.scrollWidth <= width + 1 && inner.offsetHeight <= Math.min(height, lineHeight * maxLines + 2)
        if (fits) lo = mid
        else hi = mid
      }
      setSize(Math.floor(lo))
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(outer)
    return () => observer.disconnect()
  }, [text, max, min, maxLines])

  return (
    <div ref={box} className={cn('relative flex size-full items-center justify-center', className)}>
      <span ref={probe} aria-hidden="true" className="invisible absolute w-full text-center leading-[1.25] break-words" style={{ fontSize: max }}>
        {text}
      </span>
      <span className="w-full text-center leading-[1.25] break-words" style={{ fontSize: size }}>
        {text}
      </span>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { subscribeScroll, type ScrollFrame } from './frame'

// Reports which page section is currently being read, for navigation highlighting.
export function useActiveSection<T extends string>(
  ids: readonly T[],
  initial: T,
): T {
  const [active, setActive] = useState<T>(initial)

  useEffect(() => {
    // Without a layout engine every section measures as zero; keep the initial value.
    if (document.documentElement.scrollHeight === 0) return

    // Where each section starts on the page, measured only when sizes change.
    let tops: number[] = []
    let shown = initial
    const measure = () => {
      tops = ids.map((id) => {
        const element = document.getElementById(id)
        return element
          ? element.getBoundingClientRect().top + window.scrollY
          : Infinity
      })
    }
    const update = (frame: ScrollFrame) => {
      const readingLine = frame.y + frame.height * 0.35
      let current = initial
      ids.forEach((id, index) => {
        if ((tops[index] ?? Infinity) <= readingLine) current = id
      })
      const last = ids[ids.length - 1]
      const atEnd = frame.y > 0 && frame.y >= frame.max - 2
      const next = atEnd && last !== undefined ? last : current
      if (next === shown) return
      shown = next
      setActive(next)
    }
    return subscribeScroll(update, measure)
  }, [ids, initial])

  return active
}

import { useEffect, useState } from 'react'

// Reports which page section is currently being read, for navigation highlighting.
export function useActiveSection<T extends string>(
  ids: readonly T[],
  initial: T,
): T {
  const [active, setActive] = useState<T>(initial)

  useEffect(() => {
    // Without a layout engine every section measures as zero; keep the initial value.
    if (document.documentElement.scrollHeight === 0) return

    let frame = 0
    const update = () => {
      frame = 0
      const readingLine = window.innerHeight * 0.35
      let current = initial
      for (const id of ids) {
        const element = document.getElementById(id)
        if (element && element.getBoundingClientRect().top <= readingLine) {
          current = id
        }
      }
      const last = ids[ids.length - 1]
      const atEnd =
        window.scrollY > 0 &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 2
      setActive(atEnd && last !== undefined ? last : current)
    }
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update)
    }

    schedule()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== 0) window.cancelAnimationFrame(frame)
    }
  }, [ids, initial])

  return active
}

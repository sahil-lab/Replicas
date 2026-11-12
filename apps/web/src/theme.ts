import { useEffect, useState } from 'react'

export type Theme = 'midnight' | 'daylight'

const storageKey = 'replicas.theme'

export function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'midnight' || stored === 'daylight') return stored
  } catch {
    // Storage can be blocked; the default theme still applies.
  }
  return 'midnight'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export type Point = { x: number; y: number }

export function useTheme(): [Theme, (theme: Theme, origin?: Point) => void] {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function choose(next: Theme, origin?: Point) {
    const root = document.documentElement
    const commit = () => {
      applyTheme(next)
      setTheme(next)
    }
    // With motion on, the new theme spreads out from the control that set it.
    if (
      origin &&
      next !== theme &&
      root.dataset.motion === 'on' &&
      typeof document.startViewTransition === 'function'
    ) {
      root.style.setProperty('--reveal-x', `${origin.x}px`)
      root.style.setProperty('--reveal-y', `${origin.y}px`)
      document.startViewTransition(commit)
    } else {
      commit()
    }
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      // The choice still applies for this visit.
    }
  }

  return [theme, choose]
}

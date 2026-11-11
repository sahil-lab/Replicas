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

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function choose(next: Theme) {
    setTheme(next)
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      // The choice still applies for this visit.
    }
  }

  return [theme, choose]
}

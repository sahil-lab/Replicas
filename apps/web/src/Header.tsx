import { useLayoutEffect, useRef, type MouseEvent } from 'react'
import { Icon } from './Icon'
import {
  formatMs,
  sectionIds,
  sections,
  stackSummary,
  type SystemState,
} from './model'
import type { Motion } from './motion'
import type { Point, Theme } from './theme'
import { BrandMark } from './ui'
import { useActiveSection } from './useActiveSection'

type Props = {
  system: SystemState
  theme: Theme
  onTheme: (theme: Theme, origin?: Point) => void
  motion: Motion
  onMotion: (motion: Motion) => void
}

// Keyboard activation reports no pointer position; use the control's centre.
function originOf(event: MouseEvent<HTMLElement>): Point {
  if (event.clientX !== 0 || event.clientY !== 0) {
    return { x: event.clientX, y: event.clientY }
  }
  const box = event.currentTarget.getBoundingClientRect()
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
}

export function Header({ system, theme, onTheme, motion, onMotion }: Props) {
  const navRef = useRef<HTMLElement>(null)
  // Kept here, not in the page, so that reading on into the next section
  // redraws this bar and nothing else.
  const active = useActiveSection(sectionIds, 'overview')

  // Slides the highlight under the link for the section being read.
  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const place = () => {
      const current = nav.querySelector<HTMLElement>('a[aria-current]')
      nav.style.setProperty('--dock-x', `${current?.offsetLeft ?? 0}px`)
      nav.style.setProperty('--dock-w', `${current?.offsetWidth ?? 0}px`)
    }
    place()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(place)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [active])

  const animated = motion === 'on'

  return (
    <header className="hud">
      <a
        className="hud-pill brand"
        href="#overview"
        aria-label="Replicas Lab home"
      >
        <BrandMark />
        <span className="brand-name">replicas</span>
        <span className="brand-tag">lab</span>
      </a>

      <nav
        className="hud-pill dock"
        aria-label="Workspace navigation"
        ref={navRef}
      >
        <span className="dock-indicator" aria-hidden="true" />
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? 'location' : undefined}
            data-cursor="link"
          >
            <Icon name={section.icon} size={16} />
            <span>{section.label}</span>
          </a>
        ))}
      </nav>

      <div className="hud-pill tools">
        <span className="stack-pill" data-state={system.status}>
          <span className="pill-dot" aria-hidden="true" />
          <span className="pill-text">{stackSummary(system).pill}</span>
          {system.status === 'ready' && (
            <span className="pill-meta">{formatMs(system.elapsedMs)}</span>
          )}
        </span>
        <button
          className="tool"
          type="button"
          aria-label="Animations"
          aria-pressed={animated}
          title={animated ? 'Pause animations' : 'Play animations'}
          onClick={() => onMotion(animated ? 'off' : 'on')}
        >
          <Icon name={animated ? 'pause' : 'play'} size={15} />
        </button>
        <div className="theme-switch" role="group" aria-label="Theme">
          <button
            type="button"
            aria-pressed={theme === 'midnight'}
            title="Midnight theme"
            onClick={(event) => onTheme('midnight', originOf(event))}
          >
            <Icon name="moon" size={15} />
            <span className="sr-only">Midnight</span>
          </button>
          <button
            type="button"
            aria-pressed={theme === 'daylight'}
            title="Daylight theme"
            onClick={(event) => onTheme('daylight', originOf(event))}
          >
            <Icon name="sun" size={15} />
            <span className="sr-only">Daylight</span>
          </button>
        </div>
      </div>
    </header>
  )
}

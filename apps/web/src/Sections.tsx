import { Fragment, useEffect, useRef, type RefObject } from 'react'
import { invalidateLayout, subscribeScroll, type ScrollFrame } from './frame'
import { Icon } from './Icon'
import { stackSummary, type SystemState } from './model'
import {
  useMagnetic,
  useMotionEnabled,
  useReveal,
  useScrollWords,
} from './motion'
import { Decode, Heading, Marquee, Star } from './ui'

const premise =
  'A control room for coding agents, built before the first agent exists. Nothing runs here yet, and that is the point. Isolation, recovery and cost control begin with a foundation you can verify.'

const phases = [
  {
    index: '01',
    name: 'Working skeleton',
    tag: 'You are here',
    text: 'API, dashboard, migrations, health checks, and a non-executing preflight.',
    current: true,
  },
  {
    index: '02',
    name: 'Task contracts',
    tag: 'Next',
    text: 'Identity, state transitions, and retry-safe idempotency.',
    current: false,
  },
  {
    index: '03',
    name: 'Bounded workers',
    tag: 'Later',
    text: 'Leases, checkpoints, budgets, and verifiable evidence.',
    current: false,
  },
  {
    index: '04+',
    name: 'Agents & evaluation',
    tag: 'Later',
    text: 'Explicit adapters. Measured reliability. No shortcuts.',
    current: false,
  },
] as const

function Readout({
  label,
  value,
  note,
  state,
}: {
  label: string
  value: string
  note: string
  state?: SystemState['status']
}) {
  return (
    <div className="tile" data-state={state}>
      <span className="tile-label">{label}</span>
      <strong className="tile-value">{value}</strong>
      <span className="tile-note">{note}</span>
    </div>
  )
}

export function About({ system }: { system: SystemState }) {
  const reveal = useReveal()
  const premiseRef = useRef<HTMLParagraphElement>(null)
  useScrollWords(premiseRef)
  const stack = stackSummary(system)
  const ready = system.status === 'ready'

  return (
    <section className="section tone-base about" aria-label="About this phase">
      <div className="about-grid">
        <p className="eyebrow about-label" ref={reveal} data-reveal>
          <Star />
          <Decode text="The premise" />
        </p>
        <p className="premise" ref={premiseRef}>
          {premise.split(' ').map((word, index) => (
            <Fragment key={index}>
              <span className="w">{word}</span>{' '}
            </Fragment>
          ))}
        </p>
      </div>

      <div
        className="tiles"
        role="group"
        aria-label="Workspace summary"
        ref={reveal}
        data-reveal
      >
        <Readout
          label="Environment"
          value="Local only"
          note="Loopback gateway"
        />
        <Readout
          label="Stack connection"
          value={stack.value}
          note={stack.note}
          state={system.status}
        />
        <Readout
          label="Schema"
          value={ready ? `v${system.data.schemaVersion}` : '—'}
          note={ready ? 'Flyway managed' : 'Not verified'}
        />
        <Readout label="Execution" value="Disabled" note="No tasks are run" />
      </div>
    </section>
  )
}

// On a wide screen with motion on, the phases become one long horizontal
// strip that is pinned in place while vertical scrolling moves it sideways.
// Everywhere else they stay an ordinary vertical list.
function useJourney(ref: RefObject<HTMLDivElement | null>) {
  const motion = useMotionEnabled()

  useEffect(() => {
    const journey = ref.current
    const pin = journey?.querySelector<HTMLElement>('.journey-pin')
    const track = journey?.querySelector<HTMLElement>('.phases')
    const marker = journey?.querySelector<HTMLElement>('.journey-marker')
    if (!journey || !pin || !track || !marker || !motion) return
    if (
      typeof window.matchMedia !== 'function' ||
      typeof ResizeObserver === 'undefined'
    ) {
      return
    }
    const numerals = Array.from(
      track.querySelectorAll<HTMLElement>('.phase-index'),
    )
    const wide = window.matchMedia(
      '(min-width: 1000px) and (min-height: 620px)',
    )
    // How far the strip travels, where the section starts on the page, and
    // the widths of one panel and of the rail under the strip.
    let distance = 0
    let top = 0
    let panel = 0
    let rail = 0
    let stop: (() => void) | null = null

    // Only transforms are written, on the few elements that move.
    const place = (frame: ScrollFrame) => {
      const travelled = Math.min(Math.max(frame.y - top, 0), distance)
      track.style.translate = `${(-travelled).toFixed(1)}px 0`
      // The numerals travel a little faster than their panels, which gives
      // the strip some depth.
      numerals.forEach((numeral, order) => {
        const ahead = (order * panel - travelled) * 0.16
        numeral.style.translate = `${ahead.toFixed(1)}px 0`
      })
      const along = distance > 0 ? travelled / distance : 0
      marker.style.translate = `${(along * Math.max(rail - 17, 0)).toFixed(1)}px 0`
    }
    const locate = () => {
      top = journey.getBoundingClientRect().top + window.scrollY
      const first = track.firstElementChild
      panel = first instanceof HTMLElement ? first.offsetWidth : 0
      rail = marker.parentElement?.clientWidth ?? 0
    }
    // The length of the strip sets the height of the section, so it is
    // settled here, outside the frame, and positions are read again after.
    const size = () => {
      const last = track.lastElementChild
      const end =
        last instanceof HTMLElement
          ? last.offsetLeft +
            last.offsetWidth +
            parseFloat(window.getComputedStyle(track).paddingLeft)
          : 0
      distance = Math.max(Math.round(end - pin.clientWidth), 0)
      journey.style.setProperty('--jd', `${distance}px`)
      invalidateLayout()
    }
    const clear = () => {
      for (const node of [track, marker, ...numerals]) {
        node.style.removeProperty('translate')
      }
    }
    const apply = () => {
      stop?.()
      stop = null
      journey.toggleAttribute('data-journey', wide.matches)
      if (!wide.matches) {
        clear()
        return
      }
      size()
      stop = subscribeScroll(place, locate)
    }
    const sized = new ResizeObserver(() => {
      if (wide.matches) size()
    })
    sized.observe(pin)
    wide.addEventListener('change', apply)
    apply()

    return () => {
      stop?.()
      sized.disconnect()
      wide.removeEventListener('change', apply)
      journey.removeAttribute('data-journey')
      journey.style.removeProperty('--jd')
      clear()
    }
  }, [motion, ref])
}

export function Roadmap() {
  const reveal = useReveal()
  const journeyRef = useRef<HTMLDivElement>(null)
  useJourney(journeyRef)

  return (
    <section
      className="section tone-lavender roadmap"
      id="roadmap"
      aria-labelledby="next-heading"
      tabIndex={-1}
    >
      <div className="section-head" ref={reveal} data-reveal>
        <span className="numeral" aria-hidden="true">
          03
        </span>
        <div className="section-title">
          <p className="eyebrow">
            <Decode text="A foundation, not a finish line" />
          </p>
          <Heading id="next-heading" text="A little further down the road." />
        </div>
        <p className="section-lede">
          Phase 01 is what exists today. Everything from 02 onward is planned,
          not implemented.
        </p>
      </div>

      <div className="journey" ref={journeyRef}>
        <div className="journey-pin">
          <ol className="phases">
            {phases.map((phase) => (
              <li
                className="phase"
                key={phase.index}
                data-current={phase.current}
                ref={reveal}
                data-reveal
              >
                <span className="phase-index">{phase.index}</span>
                <h3 className="phase-name">{phase.name}</h3>
                <p className="phase-text">{phase.text}</p>
                <span className="phase-tag">{phase.tag}</span>
              </li>
            ))}
          </ol>
          <div className="journey-rail" aria-hidden="true">
            <i className="journey-marker" />
            {phases.map((phase) => (
              <span key={phase.index} data-current={phase.current}>
                {phase.index}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  const reveal = useReveal()
  const magnetic = useMagnetic(0.25)
  const finaleRef = useRef<HTMLDivElement>(null)

  // The footer sits under the page and is uncovered by the last section, but
  // only when all of it fits on screen. A taller footer stays in the normal
  // flow, because its top could otherwise never be reached.
  useEffect(() => {
    const finale = finaleRef.current
    const footer = finale?.querySelector<HTMLElement>('.footer')
    const space = finale?.querySelector<HTMLElement>('.footer-space')
    const marquee = footer?.querySelector<HTMLElement>('.footer-marquee')
    if (!finale || !footer || !space) return
    if (typeof ResizeObserver === 'undefined') return

    // Whether the footer fits decides how the end of the page is laid out,
    // so it is settled here, outside the frame.
    const fit = () => {
      const height = footer.offsetHeight
      finale.style.setProperty('--footer-h', `${height}px`)
      finale.toggleAttribute(
        'data-under',
        height > 0 && height <= window.innerHeight,
      )
      invalidateLayout()
    }
    const sized = new ResizeObserver(fit)
    sized.observe(footer)
    window.addEventListener('resize', fit)
    // Whether the footer waits under the page, where the room kept for it
    // starts, and how tall that room is.
    let under = false
    let top = 0
    let room = 1
    const stop = subscribeScroll(
      (frame) => {
        if (!under) {
          footer.removeAttribute('data-shown')
          return
        }
        const uncovered = frame.y + frame.height - top
        const shown = Math.min(Math.max(uncovered / room, 0), 1)
        marquee?.style.setProperty('--fr', shown.toFixed(4))
        footer.toggleAttribute('data-shown', shown > 0)
      },
      () => {
        under = finale.hasAttribute('data-under')
        top = space.getBoundingClientRect().top + window.scrollY
        room = Math.max(space.offsetHeight, 1)
      },
    )

    return () => {
      stop()
      sized.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [])

  // Focus must never land on something still hidden under the page.
  function bringIntoView() {
    if (!finaleRef.current?.hasAttribute('data-under')) return
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'instant',
    })
  }

  return (
    <div className="finale" ref={finaleRef}>
      <div className="footer-space" aria-hidden="true" />
      <footer className="section tone-night footer" onFocus={bringIntoView}>
        <Marquee className="footer-marquee" copies={3} decorative>
          <span>Build boldly.</span>
          <Star />
          <em>Start safely.</em>
          <Star />
        </Marquee>

        <div className="footer-grid" ref={reveal} data-reveal>
          <p className="boundary">
            <strong>A lab, not a production boundary.</strong> Docker alone is
            not a hardened boundary for untrusted code.
          </p>
          <div className="footer-meta">
            <p className="colophon">
              Independent prototype. Not affiliated with Replicas.
            </p>
            <p className="footer-phase">Phase 01 · Working skeleton</p>
          </div>
          <a
            className="to-top"
            href="#overview"
            ref={magnetic}
            data-cursor="label"
            data-cursor-label="Top"
          >
            <Icon name="arrowUp" size={22} />
            <span>Back to top</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

import { Fragment, useRef } from 'react'
import { Icon } from './Icon'
import { stackSummary, type SystemState } from './model'
import { useMagnetic, useReveal, useScrollWords } from './motion'
import { Marquee, Star } from './ui'

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
          The premise
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

export function Roadmap() {
  const reveal = useReveal()

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
          <p className="eyebrow">A foundation, not a finish line</p>
          <h2 id="next-heading">A little further down the road.</h2>
        </div>
        <p className="section-lede">
          Phase 01 is what exists today. Everything from 02 onward is planned,
          not implemented.
        </p>
      </div>

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
    </section>
  )
}

export function Footer() {
  const reveal = useReveal()
  const magnetic = useMagnetic(0.25)

  return (
    <footer className="section tone-night footer">
      <Marquee className="footer-marquee" copies={3} decorative>
        <span>Build boldly.</span>
        <Star />
        <em>Start safely.</em>
        <Star />
      </Marquee>

      <div className="footer-grid" ref={reveal} data-reveal>
        <p className="boundary">
          <strong>A lab, not a production boundary.</strong> Docker alone is not
          a hardened boundary for untrusted code.
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
  )
}

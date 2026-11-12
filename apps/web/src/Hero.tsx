import type { Ref } from 'react'
import { HeroCanvas } from './HeroCanvas'
import { Icon } from './Icon'
import type { SystemState } from './model'
import { useMagnetic } from './motion'
import { Marquee, RingText, Star, Words } from './ui'

type Props = {
  status: SystemState['status']
  booted: boolean
  pinRef: Ref<HTMLDivElement>
}

export function Hero({ status, booted, pinRef }: Props) {
  const magnetic = useMagnetic(0.28)

  return (
    <section
      className="hero"
      id="overview"
      aria-labelledby="page-title"
      tabIndex={-1}
    >
      <div className="hero-pin" ref={pinRef}>
        <div className="hero-backdrop" aria-hidden="true">
          <i className="orb orb-a" />
          <i className="orb orb-b" />
          <i className="orb orb-c" />
        </div>

        <div className="hero-meta">
          <p>
            Replicas Lab<span aria-hidden="true"> — </span>
            <span className="sr-only">, </span>
            Coding-agent orchestrator
          </p>
          <p>
            Phase 01<span aria-hidden="true"> / </span>
            <span className="sr-only">, </span>
            Working skeleton
          </p>
        </div>

        <div className="hero-center">
          <h1
            className="hero-title"
            id="page-title"
            aria-label="Build boldly. Start safely."
          >
            <span className="line line-back">
              <Words text="Build boldly." />
            </span>
            <span className="line line-outline">
              <Words text="Build boldly." />
            </span>
            <span className="line line-front">
              <Words text="Start safely." />
            </span>
          </h1>
          <HeroCanvas state={status} booted={booted} />
        </div>

        <div className="hero-foot">
          <div className="hero-intro">
            <p className="hero-lede">
              A control room for coding agents, built before the first agent
              exists. Inspect the local stack, set the limits, and validate a
              synthetic configuration.
            </p>
            <a className="text-link" href="#foundation" data-cursor="link">
              Inspect the stack
              <Icon name="arrow" size={16} />
            </a>
          </div>
          <p className="scroll-cue" aria-hidden="true">
            <span>Scroll</span>
            <i />
          </p>
          <a
            className="cta-orbit"
            href="#preflight"
            aria-label="Run a preflight"
            ref={magnetic}
            data-cursor="label"
            data-cursor-label="Go"
          >
            <RingText
              id="cta-ring"
              text="Run a preflight • Run a preflight • "
            />
            <Icon name="arrowDown" size={30} />
          </a>
        </div>

        <Marquee className="hero-marquee" copies={6}>
          <span>Loopback only</span>
          <Star />
          <span>Synthetic data</span>
          <Star />
          <span>Execution disabled</span>
          <Star />
          <span>Independent prototype</span>
          <Star />
        </Marquee>
      </div>
    </section>
  )
}

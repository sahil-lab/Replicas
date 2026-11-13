import { useRef, type Ref } from 'react'
import { HeroCanvas } from './HeroCanvas'
import { Icon } from './Icon'
import { useKineticType } from './kinetic'
import type { SystemState } from './model'
import { useMagnetic } from './motion'
import { useSpotlight } from './tilt'
import { Decode, Letters, Marquee, RingText, Star } from './ui'

type Props = {
  status: SystemState['status']
  booted: boolean
  pinRef: Ref<HTMLDivElement>
}

export function Hero({ status, booted, pinRef }: Props) {
  const magnetic = useMagnetic(0.28)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const lightRef = useRef<HTMLElement>(null)
  useKineticType(titleRef, booted)
  useSpotlight(lightRef)

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
          <i className="spotlight" ref={lightRef} />
        </div>

        <div className="hero-meta" data-cover="">
          <p>
            <Decode
              text="Replicas Lab — Coding-agent orchestrator"
              active={booted}
            />
          </p>
          <p>
            <Decode text="Phase 01 / Working skeleton" active={booted} />
          </p>
        </div>

        <div className="hero-center">
          <h1
            className="hero-title"
            id="page-title"
            aria-label="Build boldly. Start safely."
            ref={titleRef}
          >
            <span className="line line-back" data-cover="">
              <Letters text="Build boldly." />
            </span>
            <span className="line line-outline" data-cover="">
              <Letters text="Build boldly." />
            </span>
            <span className="line line-front" data-cover="">
              <Letters text="Start safely." />
            </span>
          </h1>
          <HeroCanvas state={status} booted={booted} />
        </div>

        <div className="hero-foot" data-cover="">
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

        <i className="hero-dim" data-cover="" aria-hidden="true" />
      </div>
    </section>
  )
}

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ApiError,
  checkPreflight,
  errorMessage,
  getSystem,
  type PreflightOutcome,
} from './api'
import { Cursor } from './Cursor'
import { enableWheelInertia, subscribeScroll } from './frame'
import { Header } from './Header'
import { Hero } from './Hero'
import {
  type CopyState,
  type PreflightFailure,
  type Sample,
  type SystemState,
} from './model'
import { hasFinePointer, MotionContext, useMotionSetting } from './motion'
import { PreflightSection } from './PreflightSection'
import { Preloader } from './Preloader'
import { About, Footer, Roadmap } from './Sections'
import { SystemSection } from './SystemSection'
import { useTheme } from './theme'

// Enough checks to show a trend without the bars becoming hairlines.
const historyLength = 16

export default function Dashboard() {
  const [theme, chooseTheme] = useTheme()
  const [motion, chooseMotion] = useMotionSetting()
  // The boot sequence plays once, and only when motion was on at load.
  const [intro] = useState(() => motion === 'on')
  const [booted, setBooted] = useState(() => motion !== 'on')
  const [system, setSystem] = useState<SystemState>({ status: 'loading' })
  const [history, setHistory] = useState<Sample[]>([])
  const [reload, setReload] = useState(0)
  const [label, setLabel] = useState('synthetic-demo')
  const [timeout, setTimeoutValue] = useState('300')
  const [memory, setMemory] = useState('512')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<PreflightOutcome | null>(null)
  const [failure, setFailure] = useState<PreflightFailure | null>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const pinRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const started = performance.now()
    const record = (sample: Sample) =>
      setHistory((samples) => [...samples, sample].slice(-historyLength))
    getSystem(controller.signal)
      .then((data) => {
        if (!active) return
        const elapsedMs = performance.now() - started
        setSystem({ status: 'ready', data, elapsedMs, checkedAt: new Date() })
        record({ ms: elapsedMs })
      })
      .catch((error: unknown) => {
        if (!active) return
        setSystem({ status: 'error', message: errorMessage(error) })
        record({ failed: true })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [reload])

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = window.setTimeout(() => setCopyState('idle'), 2400)
    return () => window.clearTimeout(timer)
  }, [copyState])

  useEffect(() => {
    if (motion !== 'on' || !hasFinePointer()) return
    return enableWheelInertia()
  }, [motion])

  // The hero stays pinned while the page slides over it. Once it is fully
  // covered it is hidden, so it costs nothing and cannot take focus.
  useEffect(() => {
    const pin = pinRef.current
    if (!pin) return
    // The parts of the hero that move or fade as it is covered. Each is told
    // how far along the cover is, so nothing else has to be restyled.
    const parts = [pin, ...pin.querySelectorAll<HTMLElement>('[data-cover]')]
    let pinHeight = 1
    let heroHeight = 1
    let shown = -1
    return subscribeScroll(
      (frame) => {
        const covered = Math.min(frame.y / pinHeight, 1)
        if (covered !== shown) {
          shown = covered
          const value = covered.toFixed(4)
          for (const part of parts) part.style.setProperty('--hp', value)
        }
        pin.toggleAttribute('data-covered', frame.y >= heroHeight)
        const bar = progressRef.current
        if (bar) {
          const read = frame.max > 0 ? Math.min(frame.y / frame.max, 1) : 0
          bar.style.transform = `scaleX(${read.toFixed(4)})`
        }
      },
      () => {
        pinHeight = Math.max(pin.offsetHeight, 1)
        heroHeight = pin.parentElement?.offsetHeight ?? pinHeight
      },
    )
  }, [])

  const reveal = useCallback(() => setBooted(true), [])

  // The preview and the request share this object, so they cannot drift apart.
  const configuration = {
    label,
    timeoutSeconds: Number(timeout),
    memoryMiB: Number(memory),
  }

  function clearFeedback() {
    setOutcome(null)
    setFailure(null)
  }

  function refreshSystem() {
    setSystem({ status: 'loading' })
    setReload((value) => value + 1)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearFeedback()
    setBusy(true)
    try {
      setOutcome(await checkPreflight(configuration))
    } catch (error: unknown) {
      setFailure({
        message: errorMessage(error),
        status: error instanceof ApiError ? error.status : null,
        fields: error instanceof ApiError ? error.fields : {},
      })
    } finally {
      setBusy(false)
    }
  }

  async function copyInstallationId(id: string) {
    const clipboard: Clipboard | undefined = navigator.clipboard
    try {
      if (!clipboard) throw new Error('Clipboard unavailable')
      await clipboard.writeText(id)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <MotionContext value={motion}>
      <div className="app" data-loaded={booted}>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="progress" ref={progressRef} aria-hidden="true" />

        <Header
          system={system}
          theme={theme}
          onTheme={chooseTheme}
          motion={motion}
          onMotion={chooseMotion}
        />

        <main id="main-content" tabIndex={-1}>
          <Hero status={system.status} booted={booted} pinRef={pinRef} />
          <div className="sheet">
            <About system={system} />
            <PreflightSection
              label={label}
              timeout={timeout}
              memory={memory}
              busy={busy}
              configuration={configuration}
              outcome={outcome}
              failure={failure}
              onLabel={(value) => {
                setLabel(value)
                clearFeedback()
              }}
              onTimeout={(value) => {
                setTimeoutValue(value)
                clearFeedback()
              }}
              onMemory={(value) => {
                setMemory(value)
                clearFeedback()
              }}
              onSubmit={(event) => {
                void submit(event)
              }}
            />
            <SystemSection
              system={system}
              history={history}
              copyState={copyState}
              onRefresh={refreshSystem}
              onCopy={(id) => {
                void copyInstallationId(id)
              }}
            />
            <Roadmap />
            <Footer />
          </div>
        </main>

        <div className="grain" aria-hidden="true" />
        <Cursor />
        {intro && (
          <Preloader settled={system.status !== 'loading'} onReveal={reveal} />
        )}
      </div>
    </MotionContext>
  )
}

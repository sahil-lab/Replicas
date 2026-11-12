import { useEffect, useRef, useState } from 'react'

type Phase = 'loading' | 'leaving' | 'gone'

// A short boot sequence shown only when motion is enabled. The counter eases
// toward real milestones: typefaces loaded, then the first stack response.
// It never waits longer than a few seconds, and it is hidden from assistive
// technology because the page beneath is already usable.
export function Preloader({
  settled,
  onReveal,
}: {
  settled: boolean
  onReveal: () => void
}) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [fonts, setFonts] = useState(() => document.fonts === undefined)
  const counterRef = useRef<HTMLSpanElement>(null)
  const startedRef = useRef(0)
  const valueRef = useRef(0)

  useEffect(() => {
    let active = true
    void document.fonts?.ready.then(() => {
      if (active) setFonts(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    if (startedRef.current === 0) startedRef.current = window.performance.now()
    let frame = 0
    const step = (now: number) => {
      const elapsed = now - startedRef.current
      const target =
        elapsed > 3200 || (fonts && settled) ? 100 : fonts ? 74 : 36
      valueRef.current = Math.min(
        target,
        valueRef.current + (target - valueRef.current) * 0.09 + 0.15,
      )
      const counter = counterRef.current
      if (counter) {
        counter.textContent = String(Math.round(valueRef.current)).padStart(
          3,
          '0',
        )
      }
      if (target === 100 && valueRef.current >= 99.5 && elapsed > 900) {
        setPhase('leaving')
        onReveal()
        return
      }
      frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [phase, fonts, settled, onReveal])

  useEffect(() => {
    if (phase !== 'leaving') return
    const timer = window.setTimeout(() => setPhase('gone'), 1300)
    return () => window.clearTimeout(timer)
  }, [phase])

  if (phase === 'gone') return null

  return (
    <div className="preloader" data-phase={phase} aria-hidden="true">
      <div className="preloader-top">
        <span>Replicas Lab</span>
        <span>Phase 01</span>
      </div>
      <ul className="preloader-steps">
        <li data-done={fonts}>Typefaces</li>
        <li data-done={settled}>Local stack</li>
      </ul>
      <p className="preloader-caption">Preparing the control room</p>
      <p className="preloader-count">
        <span ref={counterRef}>000</span>
      </p>
    </div>
  )
}

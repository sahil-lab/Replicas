import { useEffect, useRef } from 'react'
import { subscribeScroll } from './frame'
import { useMotionEnabled } from './motion'
import { createStackRenderer, type StackRenderer } from './stackRenderer'
import { StackSchematic } from './StackSchematic'

type Props = {
  state: 'loading' | 'ready' | 'error'
  booted: boolean
}

const looks = {
  loading: { vivid: 0.55, energy: 0.6 },
  ready: { vivid: 1, energy: 1 },
  error: { vivid: 0, energy: 0.12 },
} as const

// The real-time sculpture. Falls back to the flat schematic when WebGL is
// unavailable, and to a single still frame on software or slow renderers.
export function HeroCanvas({ state, booted }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<StackRenderer | null>(null)
  const liveRef = useRef(false)
  const introPlayedRef = useRef(false)
  const motion = useMotionEnabled()

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    if (typeof WebGLRenderingContext === 'undefined') {
      stage.dataset.gl = 'fallback'
      return
    }
    const renderer = createStackRenderer(canvas, {
      motes: true,
      onLost: () => {
        rendererRef.current = null
        stage.dataset.gl = 'fallback'
      },
      onSlow: () => {
        liveRef.current = false
        rendererRef.current?.stop()
        rendererRef.current?.still()
        stage.dataset.gl = 'still'
      },
    })
    if (!renderer) {
      stage.dataset.gl = 'fallback'
      return
    }
    rendererRef.current = renderer
    liveRef.current = !renderer.software
    stage.dataset.gl = renderer.software ? 'still' : 'live'
    // On a GPU the stack is drawn once straight away, while the boot screen
    // still covers the page, so the first animated frame does not have to
    // wait for the graphics driver to prepare the drawing.
    if (!renderer.software) renderer.still()

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            // Resizing clears the canvas, so a paused scene is redrawn.
            if (stage.dataset.playing === 'true') renderer.resize()
            else if (stage.dataset.playing === 'false') renderer.still()
          })
    observer?.observe(canvas)

    return () => {
      observer?.disconnect()
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    const renderer = rendererRef.current
    const stage = stageRef.current
    if (!renderer || !stage) return
    renderer.setTargets(looks[state])
    if (!booted) return

    if (!motion || !liveRef.current) {
      renderer.stop()
      // A CPU renderer waits for the settled look instead of drawing twice.
      if (renderer.software && state === 'loading') return
      renderer.still()
      stage.dataset.playing = 'false'
      return
    }

    if (!introPlayedRef.current) {
      introPlayedRef.current = true
      renderer.beginIntro()
    }

    // The hero is out of sight once the page has scrolled past its section.
    const hero = stage.closest<HTMLElement>('.hero')
    let extent = Math.max(hero?.offsetHeight ?? window.innerHeight, 1)
    let covered = window.scrollY >= extent
    const sync = () => {
      const playing = !covered && !document.hidden && liveRef.current
      stage.dataset.playing = String(playing)
      if (playing) renderer.start()
      else renderer.stop()
    }
    const pointer = (event: PointerEvent) => {
      renderer.setTargets({
        pointerX: (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1,
        pointerY: (event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1,
      })
    }
    // A press anywhere over the hero sends a wave of light up the stack.
    const press = () => {
      if (!covered) renderer.pulse()
    }
    const unsubscribe = subscribeScroll(
      (frame) => {
        renderer.setTargets({ spread: Math.min(frame.y / extent, 1) })
        const nowCovered = frame.y >= extent
        if (nowCovered !== covered) {
          covered = nowCovered
          sync()
        }
      },
      () => {
        extent = Math.max(hero?.offsetHeight ?? window.innerHeight, 1)
      },
    )
    window.addEventListener('pointermove', pointer, { passive: true })
    window.addEventListener('pointerdown', press, { passive: true })
    document.addEventListener('visibilitychange', sync)
    sync()

    return () => {
      unsubscribe()
      window.removeEventListener('pointermove', pointer)
      window.removeEventListener('pointerdown', press)
      document.removeEventListener('visibilitychange', sync)
      renderer.stop()
      stage.dataset.playing = 'false'
    }
  }, [motion, state, booted])

  return (
    <div
      className="hero-stage"
      ref={stageRef}
      data-gl="pending"
      data-cover=""
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
      <StackSchematic count={21} width={1} state={state} />
    </div>
  )
}

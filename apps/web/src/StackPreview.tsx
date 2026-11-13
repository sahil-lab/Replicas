import { useCallback, useEffect, useRef } from 'react'
import { useMotionEnabled } from './motion'
import { createStackRenderer, type StackRenderer } from './stackRenderer'
import { StackSchematic } from './StackSchematic'

export type PreviewResult = 'idle' | 'busy' | 'ok' | 'bad'

type Props = {
  count: number
  width: number
  result: PreviewResult
}

const looks = {
  idle: { vivid: 1, energy: 0.8 },
  busy: { vivid: 1, energy: 2.4 },
  ok: { vivid: 1, energy: 1 },
  bad: { vivid: 0, energy: 0.15 },
} as const

// The stack drawn from the limits in the form. It is real-time on a GPU and
// a flat schematic everywhere else: a CPU renderer would stall the sliders.
export function StackPreview({ count, width, result }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<StackRenderer | null>(null)
  const flags = useRef({
    motion: false,
    visible: false,
    live: false,
    introduced: false,
  })
  const motion = useMotionEnabled()

  // Animates only while it can be seen; otherwise holds one settled frame.
  const sync = useCallback(() => {
    const renderer = rendererRef.current
    const stage = stageRef.current
    if (!renderer || !stage) return
    const state = flags.current
    const playing =
      state.live && state.motion && state.visible && !document.hidden
    stage.dataset.playing = String(playing)
    if (playing) {
      if (!state.introduced) {
        state.introduced = true
        renderer.beginIntro()
      }
      renderer.start()
      return
    }
    renderer.stop()
    if (state.visible) renderer.still()
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!stage || !canvas) return
    if (typeof WebGLRenderingContext === 'undefined') {
      stage.dataset.gl = 'fallback'
      return
    }
    const state = flags.current
    const renderer = createStackRenderer(canvas, {
      maxSize: 900,
      zoom: 1.15,
      onLost: () => {
        rendererRef.current = null
        stage.dataset.gl = 'fallback'
      },
      onSlow: () => {
        state.live = false
        stage.dataset.gl = 'still'
        sync()
      },
    })
    if (!renderer || renderer.software) {
      renderer?.dispose()
      stage.dataset.gl = 'fallback'
      return
    }
    rendererRef.current = renderer
    state.live = true
    stage.dataset.gl = 'live'
    renderer.setTargets({ pointerX: 0, pointerY: -0.3 })
    // Drawn once straight away, while the boot screen still covers the page,
    // so that showing it for the first time later costs nothing new.
    renderer.still()

    const seen =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => {
            state.visible = entries.at(-1)?.isIntersecting ?? false
            sync()
          })
    if (seen) seen.observe(stage)
    else state.visible = true
    const sized =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            // Resizing clears the canvas, so a paused scene is redrawn.
            if (stage.dataset.playing === 'true') renderer.resize()
            else if (state.visible) renderer.still()
          })
    sized?.observe(canvas)
    document.addEventListener('visibilitychange', sync)

    return () => {
      seen?.disconnect()
      sized?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      renderer.dispose()
      rendererRef.current = null
    }
  }, [sync])

  useEffect(() => {
    flags.current.motion = motion
    rendererRef.current?.setTargets({ count, width, ...looks[result] })
    sync()
  }, [motion, count, width, result, sync])

  // An accepted configuration sends one band of light up the stack.
  useEffect(() => {
    if (result === 'ok') rendererRef.current?.pulse()
  }, [result])

  return (
    <div
      className="preview-stage"
      ref={stageRef}
      data-gl="pending"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} />
      <StackSchematic
        count={count}
        width={width}
        state={result === 'bad' ? 'error' : 'ready'}
        pulse={result === 'ok'}
      />
    </div>
  )
}

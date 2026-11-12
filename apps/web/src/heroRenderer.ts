import { fragmentSource, vertexSource } from './heroShader'

export type HeroTargets = {
  pointerX: number
  pointerY: number
  spread: number
  vivid: number
  energy: number
}

export type HeroRenderer = {
  // True when the browser draws WebGL on the CPU; animating would be wasteful.
  readonly software: boolean
  setTargets(targets: Partial<HeroTargets>): void
  beginIntro(): void
  start(): void
  stop(): void
  // Draws one settled frame at the current targets.
  still(): void
  resize(): void
  dispose(): void
}

type Options = {
  onLost: () => void
  onSlow: () => void
}

// A CPU renderer takes hundreds of milliseconds per frame at full size, so
// its single still frame is drawn smaller and scaled up by the page.
const maxSize = 900
const maxSoftwareSize = 480
const softwareRenderers = /swiftshader|llvmpipe|software|basic render/i

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

export function createHeroRenderer(
  canvas: HTMLCanvasElement,
  options: Options,
): HeroRenderer | null {
  const context = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    powerPreference: 'high-performance',
  })
  if (!context) return null
  const gl: WebGLRenderingContext = context

  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!vertex || !fragment || !program) return null
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  )
  const position = gl.getAttribLocation(program, 'aPosition')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const locate = (name: string) => gl.getUniformLocation(program, name)
  const uniforms = {
    resolution: locate('uResolution'),
    time: locate('uTime'),
    pointer: locate('uPointer'),
    spread: locate('uSpread'),
    intro: locate('uIntro'),
    vivid: locate('uVivid'),
    energy: locate('uEnergy'),
  }

  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const rendererName = String(
    gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  )
  const software = softwareRenderers.test(rendererName)
  const sizeLimit = software ? maxSoftwareSize : maxSize

  const target: HeroTargets = {
    pointerX: 0,
    pointerY: 0,
    spread: 0,
    vivid: 1,
    energy: 1,
  }
  const current: HeroTargets = { ...target }
  let intro = 1
  let introStarted = -1
  let time = 2.4
  let quality = 1
  let frame = 0
  let last = 0
  let warmup = 0
  let sampled = 0
  let sampleTotal = 0
  let disposed = false
  // Describes the still frame on screen, so an identical one is not redrawn.
  let shown = ''

  function resize() {
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const size = Math.max(
      64,
      Math.min(sizeLimit, Math.round(rect.width * ratio * quality)),
    )
    if (canvas.width !== size || canvas.height !== size) {
      canvas.width = size
      canvas.height = size
    }
    gl.viewport(0, 0, size, size)
  }

  function draw() {
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
    gl.uniform1f(uniforms.time, time)
    gl.uniform2f(uniforms.pointer, current.pointerX, current.pointerY)
    gl.uniform1f(uniforms.spread, current.spread)
    gl.uniform1f(uniforms.intro, intro)
    gl.uniform1f(uniforms.vivid, current.vivid)
    gl.uniform1f(uniforms.energy, current.energy)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  // Lowers the internal resolution on slow hardware, then gives up animating.
  function measure(delta: number) {
    if (warmup < 5) {
      warmup += 1
      return
    }
    sampleTotal += delta
    sampled += 1
    if (sampled < 24) return
    const average = sampleTotal / sampled
    sampled = 0
    sampleTotal = 0
    if (average <= 30) return
    if (quality > 0.5) {
      quality = Math.max(0.5, quality - 0.25)
      warmup = 0
      resize()
      return
    }
    if (average > 48) options.onSlow()
  }

  function tick(now: number) {
    frame = 0
    if (disposed) return
    const delta = last === 0 ? 16 : Math.min(now - last, 100)
    last = now

    const follow = 1 - Math.exp(-delta / 260)
    const settle = 1 - Math.exp(-delta / 140)
    current.pointerX += (target.pointerX - current.pointerX) * follow
    current.pointerY += (target.pointerY - current.pointerY) * follow
    current.spread += (target.spread - current.spread) * settle
    current.vivid += (target.vivid - current.vivid) * follow
    current.energy += (target.energy - current.energy) * follow
    if (introStarted >= 0) {
      const progress = Math.min((now - introStarted) / 2400, 1)
      intro = 1 - Math.pow(1 - progress, 4)
      if (progress >= 1) introStarted = -1
    }
    time += (delta / 1000) * (0.3 + 0.7 * current.energy)

    draw()
    shown = ''
    measure(delta)
    frame = window.requestAnimationFrame(tick)
  }

  function stop() {
    if (frame !== 0) window.cancelAnimationFrame(frame)
    frame = 0
  }

  const lost = (event: Event) => {
    event.preventDefault()
    stop()
    options.onLost()
  }
  canvas.addEventListener('webglcontextlost', lost)

  resize()

  return {
    software,
    setTargets(targets) {
      Object.assign(target, targets)
    },
    beginIntro() {
      intro = 0
      introStarted = window.performance.now()
    },
    start() {
      if (frame !== 0 || disposed) return
      last = 0
      frame = window.requestAnimationFrame(tick)
    },
    stop,
    still() {
      if (disposed) return
      Object.assign(current, target)
      intro = 1
      introStarted = -1
      resize()
      const next = [
        canvas.width,
        time,
        current.vivid,
        current.energy,
        current.spread,
        current.pointerX,
        current.pointerY,
      ].join(':')
      if (next === shown) return
      shown = next
      draw()
    },
    resize,
    dispose() {
      disposed = true
      stop()
      canvas.removeEventListener('webglcontextlost', lost)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

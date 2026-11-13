import {
  buildMotes,
  buildPlates,
  FLOATS_PER_VERTEX,
  MAX_PLATES,
  MOTE_COUNT,
  orbitCamera,
} from './stackGeometry'
import {
  moteFragment,
  moteVertex,
  plateFragment,
  plateVertex,
} from './stackShader'

export type StackTargets = {
  pointerX: number
  pointerY: number
  spread: number
  vivid: number
  energy: number
  // Number of plates and their width as a fraction of the full size.
  count: number
  width: number
}

export type StackRenderer = {
  // True when the browser draws WebGL on the CPU; animating would be wasteful.
  readonly software: boolean
  setTargets(targets: Partial<StackTargets>): void
  // The plates drop into place one after another.
  beginIntro(): void
  // A wave of light climbs the stack and each plate hops as it passes.
  pulse(): void
  start(): void
  stop(): void
  // Draws one settled frame at the current targets.
  still(): void
  resize(): void
  dispose(): void
}

type Options = {
  // Largest canvas edge in device pixels, and the camera magnification.
  maxSize?: number
  zoom?: number
  // Specks of light drifting around the stack.
  motes?: boolean
  onLost: () => void
  onSlow: () => void
}

const softwareRenderers = /swiftshader|llvmpipe|software|basic render/i
// A CPU renderer draws one still frame, and a smaller one keeps that quick.
const maxSoftwareSize = 640
const SPACING = 0.105

// How far through an animation a frame is, from 0 to 1. A frame's timestamp
// can be earlier than the moment the animation was started.
const fraction = (elapsed: number, duration: number) =>
  Math.min(Math.max(elapsed / duration, 0), 1)

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high)

function build(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: readonly string[],
) {
  const program = gl.createProgram()
  if (!program) return null
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ] as const) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null
    gl.attachShader(program, shader)
  }
  attributes.forEach((name, index) => {
    gl.bindAttribLocation(program, index, name)
  })
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

export function createStackRenderer(
  canvas: HTMLCanvasElement,
  options: Options,
): StackRenderer | null {
  // Edges are softened in the shader, which costs far less than letting the
  // GPU blend every sample of a multisampled canvas.
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

  // The softening uses screen-space derivatives where the browser has them.
  const derivatives = gl.getExtension('OES_standard_derivatives') !== null
  const plateProgram = build(
    gl,
    plateVertex,
    (derivatives
      ? '#extension GL_OES_standard_derivatives : enable\n' +
        '#define SOFTNESS fwidth(edge) * 1.2\n' +
        '#define WALL_SOFT clamp(fwidth(level) * 1.5, 0.02, 0.9)\n'
      : '#define SOFTNESS uSoft\n#define WALL_SOFT 0.3\n') + plateFragment,
    ['aLocal', 'aNormal', 'aMeta'],
  )
  const moteProgram = options.motes
    ? build(gl, moteVertex, moteFragment, ['aSeed'])
    : null
  const plateBuffer = gl.createBuffer()
  const moteBuffer = gl.createBuffer()
  if (!plateProgram || !plateBuffer || !moteBuffer) return null

  const plateVertices = buildPlates()
  gl.bindBuffer(gl.ARRAY_BUFFER, plateBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, plateVertices, gl.STATIC_DRAW)
  if (moteProgram) {
    gl.bindBuffer(gl.ARRAY_BUFFER, moteBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, buildMotes(), gl.STATIC_DRAW)
  }
  const plateUniform = (name: string) =>
    gl.getUniformLocation(plateProgram, name)
  const plates = {
    camera: plateUniform('uCamera'),
    eye: plateUniform('uEye'),
    pose: plateUniform('uPose'),
    sway: plateUniform('uSway'),
    floor: plateUniform('uFloor'),
    top: plateUniform('uTop'),
    vivid: plateUniform('uVivid'),
    glow: plateUniform('uGlow'),
    soft: plateUniform('uSoft'),
  }
  const moteUniform = (name: string) =>
    moteProgram ? gl.getUniformLocation(moteProgram, name) : null
  const motes = {
    camera: moteUniform('uCamera'),
    forward: moteUniform('uForward'),
    time: moteUniform('uTime'),
    field: moteUniform('uField'),
    layer: moteUniform('uLayer'),
    vivid: moteUniform('uVivid'),
  }

  // Colours are premultiplied: light can be added and glass laid over with
  // the same blend.
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(0, 0, 0, 0)

  const info = gl.getExtension('WEBGL_debug_renderer_info')
  const rendererName = String(
    gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
  )
  const software = softwareRenderers.test(rendererName)
  const sizeLimit = software
    ? Math.min(maxSoftwareSize, options.maxSize ?? maxSoftwareSize)
    : (options.maxSize ?? 1200)
  const zoom = options.zoom ?? 1

  const target: StackTargets = {
    pointerX: 0,
    pointerY: 0,
    spread: 0,
    vivid: 1,
    energy: 1,
    count: MAX_PLATES,
    width: 1,
  }
  const current: StackTargets = { ...target }

  // Every plate moves on its own springs, so the stack sways, hops and
  // settles like something with weight.
  const presence = new Float32Array(MAX_PLATES)
  const presenceSpeed = new Float32Array(MAX_PLATES)
  const lift = new Float32Array(MAX_PLATES)
  const liftSpeed = new Float32Array(MAX_PLATES)
  const turn = new Float32Array(MAX_PLATES)
  const turnSpeed = new Float32Array(MAX_PLATES)
  const swayX = new Float32Array(MAX_PLATES)
  const swayXSpeed = new Float32Array(MAX_PLATES)
  const swayZ = new Float32Array(MAX_PLATES)
  const swayZSpeed = new Float32Array(MAX_PLATES)
  const heat = new Float32Array(MAX_PLATES)
  const fill = new Float32Array(MAX_PLATES)
  const wake = new Float64Array(MAX_PLATES)
  const pose = new Float32Array(MAX_PLATES * 4)
  const sway = new Float32Array(MAX_PLATES * 4)

  let centre = (MAX_PLATES - 1) / 2
  let top = MAX_PLATES - 1
  let arrival = 1
  let introStarted = -1
  let pulseStarted = -1
  let scanned = -1
  let glow = 0
  let time = 2.4
  let quality = 1
  let frame = 0
  let last = 0
  let disposed = false
  let slowWindows = 0
  const recent: number[] = []
  // Describes the still frame on screen, so an identical one is not redrawn.
  let shown = ''

  const plateCount = () => clamp(Math.round(target.count), 1, MAX_PLATES)

  // Where a plate wants to be turned to: a steady twist up the stack, with a
  // slow torsion wave travelling through it.
  const restingTurn = (plate: number) => {
    const offset = plate - centre
    const twist = 0.1 + 0.06 * current.pointerX + 0.12 * current.spread
    return (
      twist * offset +
      current.energy * 0.55 * Math.sin(time * 0.5 - offset * 0.3)
    )
  }

  const cameraYaw = () =>
    0.7 + time * 0.05 + current.pointerX * 0.4 + (1 - arrival) * 1.4

  // Where a plate wants to sit sideways: leaning with the pointer, more so
  // higher up, and stepping out into a spiral as the page scrolls on.
  const restingSway = (plate: number): [number, number] => {
    const level = plate / Math.max(top, 1)
    const yaw = cameraYaw()
    const lean = current.pointerX * 0.17 * Math.pow(level, 1.4)
    const nod = current.pointerY * 0.05 * level
    const reach = current.spread * 0.3
    const angle = restingTurn(plate) + plate * 0.74
    return [
      Math.cos(yaw) * lean + Math.sin(yaw) * nod + Math.cos(angle) * reach,
      -Math.sin(yaw) * lean + Math.cos(yaw) * nod + Math.sin(angle) * reach,
    ]
  }

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

  function advance(delta: number, now: number) {
    const follow = 1 - Math.exp(-delta / 260)
    const settle = 1 - Math.exp(-delta / 140)
    current.pointerX += (target.pointerX - current.pointerX) * follow
    current.pointerY += (target.pointerY - current.pointerY) * follow
    current.spread += (target.spread - current.spread) * settle
    current.vivid += (target.vivid - current.vivid) * follow
    current.energy += (target.energy - current.energy) * follow
    current.width += (target.width - current.width) * settle
    const count = plateCount()
    centre += ((count - 1) / 2 - centre) * settle
    top += (Math.max(count - 1, 1) - top) * settle
    time += (delta / 1000) * (0.3 + 0.7 * current.energy)

    if (introStarted >= 0) {
      const progress = fraction(now - introStarted, 2400)
      arrival = 1 - Math.pow(1 - progress, 4)
      if (progress >= 1) introStarted = -1
    }
    glow = 0
    if (pulseStarted >= 0) {
      const progress = fraction(now - pulseStarted, 1100)
      const reach = -1 + (count + 1) * (1 - Math.pow(1 - progress, 2))
      for (
        let plate = scanned + 1;
        plate < count && plate <= reach;
        plate += 1
      ) {
        heat[plate] = 1
        liftSpeed[plate] = (liftSpeed[plate] ?? 0) + 0.8
        turnSpeed[plate] = (turnSpeed[plate] ?? 0) + (plate % 2 === 0 ? 1 : -1)
        scanned = plate
      }
      glow = Math.sin(Math.PI * progress)
      if (progress >= 1) pulseStarted = -1
    }

    // Short steps keep the springs stable when a frame arrives late.
    const steps = Math.max(1, Math.ceil(delta / 8))
    const dt = delta / 1000 / steps
    const cooling = Math.exp(-delta / 320)
    const filling = 1 - Math.exp(-delta / 110)
    for (let plate = 0; plate < MAX_PLATES; plate += 1) {
      const awake = now >= (wake[plate] ?? 0)
      const wanted = awake && plate < count ? 1 : 0
      const level = plate / Math.max(top, 1)
      const [restX, restZ] = restingSway(plate)
      const restTurn = restingTurn(plate)
      // Plates higher up are held more loosely, so they trail and overshoot.
      const hold = 90 - 58 * Math.min(level, 1)
      const drag = 2 * Math.sqrt(hold) * 0.42
      let size = presence[plate] ?? 0
      let sizeSpeed = presenceSpeed[plate] ?? 0
      let height = lift[plate] ?? 0
      let heightSpeed = liftSpeed[plate] ?? 0
      let angle = turn[plate] ?? 0
      let angleSpeed = turnSpeed[plate] ?? 0
      let x = swayX[plate] ?? 0
      let xSpeed = swayXSpeed[plate] ?? 0
      let z = swayZ[plate] ?? 0
      let zSpeed = swayZSpeed[plate] ?? 0
      for (let step = 0; step < steps; step += 1) {
        sizeSpeed += (170 * (wanted - size) - 17 * sizeSpeed) * dt
        size += sizeSpeed * dt
        // A plate that has not woken yet hangs where it was put.
        if (awake) {
          heightSpeed += (-105 * height - 14 * heightSpeed) * dt
          height += heightSpeed * dt
        }
        angleSpeed += (120 * (restTurn - angle) - 15 * angleSpeed) * dt
        angle += angleSpeed * dt
        xSpeed += (hold * (restX - x) - drag * xSpeed) * dt
        x += xSpeed * dt
        zSpeed += (hold * (restZ - z) - drag * zSpeed) * dt
        z += zSpeed * dt
      }
      presence[plate] = size
      presenceSpeed[plate] = sizeSpeed
      lift[plate] = height
      liftSpeed[plate] = heightSpeed
      turn[plate] = angle
      turnSpeed[plate] = angleSpeed
      swayX[plate] = x
      swayXSpeed[plate] = xSpeed
      swayZ[plate] = z
      swayZSpeed[plate] = zSpeed
      heat[plate] = (heat[plate] ?? 0) * cooling
      const solid = plate === count - 1 ? 1 : 0
      fill[plate] = (fill[plate] ?? 0) + (solid - (fill[plate] ?? 0)) * filling
    }
  }

  // Puts everything exactly where it wants to be, with nothing in motion.
  function snap() {
    Object.assign(current, target)
    const count = plateCount()
    centre = (count - 1) / 2
    top = Math.max(count - 1, 1)
    arrival = 1
    introStarted = -1
    pulseStarted = -1
    glow = 0
    for (let plate = 0; plate < MAX_PLATES; plate += 1) {
      const [restX, restZ] = restingSway(plate)
      wake[plate] = 0
      presence[plate] = plate < count ? 1 : 0
      lift[plate] = 0
      turn[plate] = restingTurn(plate)
      swayX[plate] = restX
      swayZ[plate] = restZ
      heat[plate] = 0
      fill[plate] = plate === count - 1 ? 1 : 0
    }
    presenceSpeed.fill(0)
    liftSpeed.fill(0)
    turnSpeed.fill(0)
    swayXSpeed.fill(0)
    swayZSpeed.fill(0)
  }

  function draw() {
    const spacing = SPACING + 0.06 * current.spread
    for (let plate = 0; plate < MAX_PLATES; plate += 1) {
      const size = presence[plate] ?? 0
      pose[plate * 4] = (plate - centre) * spacing + (lift[plate] ?? 0)
      pose[plate * 4 + 1] = turn[plate] ?? 0
      pose[plate * 4 + 2] = current.width * clamp(size, 0, 1.3)
      pose[plate * 4 + 3] = heat[plate] ?? 0
      sway[plate * 4] = swayX[plate] ?? 0
      sway[plate * 4 + 1] = swayZ[plate] ?? 0
      sway[plate * 4 + 2] = fill[plate] ?? 0
      sway[plate * 4 + 3] = clamp(size * 2.5, 0, 1)
    }
    const camera = orbitCamera(
      cameraYaw(),
      0.47 - current.pointerY * 0.14 + current.spread * 0.2,
      5.9 * (1.3 - 0.3 * arrival),
      3.2 * zoom,
    )
    const stride = FLOATS_PER_VERTEX * 4

    gl.clear(gl.COLOR_BUFFER_BIT)
    const drawMotes = (layer: number) => {
      if (!moteProgram) return
      gl.useProgram(moteProgram)
      gl.bindBuffer(gl.ARRAY_BUFFER, moteBuffer)
      gl.enableVertexAttribArray(0)
      gl.disableVertexAttribArray(1)
      gl.disableVertexAttribArray(2)
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0)
      gl.uniformMatrix4fv(motes.camera, false, camera.matrix)
      gl.uniform3f(motes.forward, ...camera.forward)
      gl.uniform1f(motes.time, time)
      gl.uniform3f(
        motes.field,
        canvas.width,
        centre * spacing,
        arrival * (0.35 + 0.65 * current.vivid),
      )
      gl.uniform1f(motes.layer, layer)
      gl.uniform1f(motes.vivid, current.vivid)
      gl.drawArrays(gl.POINTS, 0, MOTE_COUNT)
    }

    drawMotes(0)
    gl.useProgram(plateProgram)
    gl.bindBuffer(gl.ARRAY_BUFFER, plateBuffer)
    gl.enableVertexAttribArray(0)
    gl.enableVertexAttribArray(1)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 12)
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 20)
    gl.uniformMatrix4fv(plates.camera, false, camera.matrix)
    gl.uniform3f(plates.eye, ...camera.eye)
    gl.uniform4fv(plates.pose, pose)
    gl.uniform4fv(plates.sway, sway)
    gl.uniform3f(
      plates.floor,
      -centre * spacing - 0.36,
      1.2 * current.width,
      0.42 * clamp(presence[0] ?? 0, 0, 1),
    )
    gl.uniform1f(plates.top, top)
    gl.uniform1f(plates.vivid, current.vivid)
    gl.uniform1f(plates.glow, glow)
    gl.uniform1f(plates.soft, 6 / Math.max(canvas.width, 1))
    gl.drawArrays(gl.TRIANGLES, 0, plateVertices.length / FLOATS_PER_VERTEX)
    drawMotes(1)
  }

  // Frames here are cheap, so slowness nearly always comes from elsewhere on
  // the page or the machine. Judged by the typical frame, not the average,
  // so that one long pause does not count against the drawing.
  function measure(delta: number) {
    recent.push(delta)
    if (recent.length < 90) return
    const typical = recent.sort((a, b) => a - b)[45] ?? 0
    recent.length = 0
    if (typical <= 34) {
      slowWindows = 0
      return
    }
    slowWindows += 1
    if (quality > 0.7) {
      quality = 0.7
      resize()
      return
    }
    if (typical > 80 && slowWindows >= 3) options.onSlow()
  }

  function tick(now: number) {
    frame = 0
    if (disposed) return
    const delta = last === 0 ? 16 : Math.min(Math.max(now - last, 0), 100)
    const measured = last === 0 ? 16 : now - last
    last = now
    advance(delta, now)
    draw()
    shown = ''
    measure(measured)
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

  snap()
  resize()

  return {
    software,
    setTargets(targets) {
      Object.assign(target, targets)
    },
    beginIntro() {
      const now = window.performance.now()
      arrival = 0
      introStarted = now
      for (let plate = 0; plate < MAX_PLATES; plate += 1) {
        wake[plate] = now + 160 + plate * 46
        presence[plate] = 0
        presenceSpeed[plate] = 0
        // Each plate starts a little above its place, inside the picture,
        // and grows as it drops.
        lift[plate] = 0.55
        liftSpeed[plate] = 0
        turn[plate] = restingTurn(plate) + 1.3
        turnSpeed[plate] = 0
        fill[plate] = 0
      }
    },
    pulse() {
      pulseStarted = window.performance.now()
      scanned = -1
    },
    start() {
      if (frame !== 0 || disposed) return
      last = 0
      recent.length = 0
      frame = window.requestAnimationFrame(tick)
    },
    stop,
    still() {
      if (disposed) return
      snap()
      resize()
      const next = [canvas.width, time, ...Object.values(current)].join(':')
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

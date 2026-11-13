// One animation frame drives everything that follows the scroll position.
// A frame works in a fixed order: move the page if a wheel glide is running,
// read the position once, measure the layout only when sizes have changed,
// then write styles. Nothing reads the layout after a write, so no frame
// lays the page out more than once.

export type ScrollFrame = {
  // Scroll position, viewport size, and how far the page can scroll.
  y: number
  width: number
  height: number
  max: number
  // Smoothed scroll speed in pixels per millisecond, signed by direction.
  velocity: number
}

type Subscriber = {
  // Writes styles for the current position. Must not read the layout.
  update: (frame: ScrollFrame) => void
  // Reads sizes and positions. Called only when they may have changed.
  measure?: () => void
  // Reads something that changes with every frame, before any write.
  read?: () => void
}

type VelocityListener = (velocity: number) => void

// Time constant of the speed smoothing, in milliseconds.
const smoothing = 60

const subscribers = new Set<Subscriber>()
// Added since the last frame: measured and updated even if nothing moved.
const fresh = new Set<Subscriber>()
const velocityListeners = new Set<VelocityListener>()
const state: ScrollFrame = { y: 0, width: 0, height: 0, max: 0, velocity: 0 }

let request = 0
let last = 0
let stale = true
let primed = false
let listening = false
let running = false
let sizes: ResizeObserver | null = null
// Moves the page for a wheel glide; answers whether it is still moving.
let glide: ((elapsed: number) => boolean) | null = null

function tick(now: number) {
  request = 0
  running = true
  // Coming from rest, the time since the last frame says nothing, so the
  // first frame counts as one ordinary frame.
  const elapsed = last === 0 ? 16 : Math.min(Math.max(now - last, 0), 100)
  last = now

  const gliding = glide ? glide(elapsed) : false
  const y = window.scrollY
  const remeasured = stale
  if (stale) {
    stale = false
    for (const subscriber of subscribers) subscriber.measure?.()
    state.width = window.innerWidth
    state.height = window.innerHeight
    state.max = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    )
  } else {
    for (const subscriber of fresh) subscriber.measure?.()
  }

  const from = primed ? state.y : y
  primed = true
  const raw = (y - from) / Math.max(elapsed, 1)
  // Smoothed by elapsed time, so the response is the same at any frame rate.
  let velocity =
    state.velocity +
    (raw - state.velocity) * (1 - Math.exp(-elapsed / smoothing))
  if (raw === 0 && Math.abs(velocity) < 0.01) velocity = 0
  const moved = y !== from || remeasured
  const speedChanged = velocity !== state.velocity
  state.y = y
  state.velocity = velocity

  const due = moved ? subscribers : fresh
  for (const subscriber of due) subscriber.read?.()
  for (const subscriber of due) subscriber.update(state)
  fresh.clear()
  if (speedChanged) {
    for (const listener of velocityListeners) listener(velocity)
  }

  running = false
  if (gliding || velocity !== 0 || stale || fresh.size > 0) schedule()
  else last = 0
}

function schedule() {
  if (request !== 0 || running) return
  if (typeof window.requestAnimationFrame !== 'function') {
    tick(window.performance.now())
    return
  }
  request = window.requestAnimationFrame(tick)
}

// Sizes or positions on the page may have changed: measure again next frame.
export function invalidateLayout() {
  stale = true
  if (listening) schedule()
}

function listen() {
  if (listening) return
  listening = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', invalidateLayout)
  if (typeof ResizeObserver !== 'undefined') {
    // The body grows and shrinks with its content.
    sizes = new ResizeObserver(invalidateLayout)
    sizes.observe(document.body)
  }
  // Typefaces arriving can move things without changing the page's size.
  void document.fonts?.ready.then(invalidateLayout)
}

function release() {
  if (subscribers.size > 0 || velocityListeners.size > 0 || glide) return
  listening = false
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', invalidateLayout)
  sizes?.disconnect()
  sizes = null
  if (request !== 0) window.cancelAnimationFrame(request)
  request = 0
  last = 0
  primed = false
  stale = true
  state.velocity = 0
}

// Calls update whenever the page has scrolled or been resized, at most once
// per frame, and once straight away.
export function subscribeScroll(
  update: (frame: ScrollFrame) => void,
  measure?: () => void,
  read?: () => void,
): () => void {
  const subscriber: Subscriber = { update, measure, read }
  subscribers.add(subscriber)
  fresh.add(subscriber)
  listen()
  schedule()
  return () => {
    subscribers.delete(subscriber)
    fresh.delete(subscriber)
    release()
  }
}

// Reports the smoothed scroll speed on every frame until the page comes to
// rest, ending with a zero.
export function subscribeVelocity(listener: VelocityListener): () => void {
  velocityListeners.add(listener)
  listen()
  return () => {
    velocityListeners.delete(listener)
    release()
  }
}

// A classic mouse wheel turns in whole notches. Touchpads and high-resolution
// wheels send a stream of small movements instead, which the browser already
// scrolls smoothly and off the main thread, so those are left to it.
function isNotch(event: WheelEvent): boolean {
  if (event.deltaMode !== 0) return true
  const legacy = (event as WheelEvent & { wheelDeltaY?: number }).wheelDeltaY
  if (typeof legacy === 'number' && legacy !== 0 && legacy % 120 === 0) {
    return true
  }
  return Math.abs(event.deltaY) >= 100 && event.deltaY % 100 === 0
}

// Wheel notches glide to their target instead of stepping. Anything else that
// moves the page (keys, links, the scrollbar, touch, a touchpad) cancels the
// glide and stays native.
export function enableWheelInertia(): () => void {
  let target = 0
  let position = 0
  let expected = 0
  let active = false

  const halt = () => {
    active = false
  }

  const step = (elapsed: number) => {
    if (!active) return false
    // Something else moved the page: let it win.
    if (Math.abs(window.scrollY - expected) > 2) {
      active = false
      return false
    }
    position += (target - position) * (1 - Math.exp(-elapsed / 120))
    if (Math.abs(target - position) < 0.5) position = target
    window.scrollTo({ top: position, behavior: 'instant' })
    expected = window.scrollY
    if (position === target) active = false
    return active
  }

  const wheel = (event: WheelEvent) => {
    if (event.defaultPrevented || event.ctrlKey || !event.cancelable) return
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
    if (!isNotch(event)) {
      halt()
      return
    }
    event.preventDefault()
    if (!active) {
      position = window.scrollY
      target = position
      expected = position
      active = true
    }
    const unit =
      event.deltaMode === 1
        ? 40
        : event.deltaMode === 2
          ? window.innerHeight
          : 1
    const limit = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0,
    )
    target = Math.min(Math.max(target + event.deltaY * unit, 0), limit)
    schedule()
  }

  glide = step
  listen()
  window.addEventListener('wheel', wheel, { passive: false })
  window.addEventListener('keydown', halt)
  window.addEventListener('pointerdown', halt)
  window.addEventListener('touchstart', halt, { passive: true })
  return () => {
    halt()
    glide = null
    window.removeEventListener('wheel', wheel)
    window.removeEventListener('keydown', halt)
    window.removeEventListener('pointerdown', halt)
    window.removeEventListener('touchstart', halt)
    release()
  }
}

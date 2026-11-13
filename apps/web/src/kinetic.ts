import { useEffect, type RefObject } from 'react'
import { hasFinePointer, useMotionEnabled } from './motion'

type Letter = {
  node: HTMLElement
  // Whether it belongs to the second line of the headline.
  second: boolean
  // Centre of the letter in the window, and its height.
  x: number
  y: number
  height: number
  // How far its top and bottom edges may move before they would reach the
  // labels above the headline or the text below it, in pixels.
  up: number
  down: number
  // How far it has swollen, from 0 to 1, how fast, and where it is headed.
  rise: number
  speed: number
  goal: number
  // Which way it leans, from -1 (left) to 1 (right), and which way it
  // grows, from -1 (all upward) to 1 (all downward).
  lean: number
  pull: number
}

// The pointer is ignored until the letters have arrived.
const arrival = 2600
// The most a letter grows, as a share of its height.
const swell = 0.2

const clamp = (value: number, low: number, high: number) =>
  Math.min(Math.max(value, low), high)

// Letters stretch and lean toward the pointer, growing up or down to meet
// it but never as far as their neighbours above and below, and spring back
// when it leaves. Only transforms change, so the headline is never laid out
// or painted again while this runs. Decoration only: the heading text itself
// never changes.
export function useKineticType(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
) {
  const enabled = useMotionEnabled()

  useEffect(() => {
    const root = ref.current
    if (!root || !enabled || !active || !hasFinePointer()) return
    const letters: Letter[] = Array.from(
      root.querySelectorAll<HTMLElement>('.ch'),
      (node) => ({
        node,
        second: node.closest('.line-front') !== null,
        x: 0,
        y: 0,
        height: 1,
        up: 0,
        down: 0,
        rise: 0,
        speed: 0,
        goal: 0,
        lean: 0,
        pull: 0,
      }),
    )
    if (letters.length === 0) return
    // Gives every letter a layer of its own for as long as this runs.
    root.setAttribute('data-kinetic', '')
    const ready = window.performance.now() + arrival
    const panel = root.closest('.hero-pin')
    let measured = false
    let frame = 0
    let last = 0

    const step = (now: number) => {
      frame = 0
      // Eased by elapsed time, in short steps so a late frame stays stable.
      const elapsed = last === 0 ? 16 : Math.min(Math.max(now - last, 0), 64)
      last = now
      const steps = Math.max(1, Math.ceil(elapsed / 8))
      const dt = elapsed / 1000 / steps
      let moving = false
      for (const letter of letters) {
        for (let index = 0; index < steps; index += 1) {
          letter.speed +=
            (210 * (letter.goal - letter.rise) - 17 * letter.speed) * dt
          letter.rise += letter.speed * dt
        }
        if (
          Math.abs(letter.goal - letter.rise) < 0.002 &&
          Math.abs(letter.speed) < 0.02
        ) {
          letter.rise = letter.goal
          letter.speed = 0
        } else {
          moving = true
        }
        const rise = letter.rise
        if (rise === 0) {
          letter.node.style.transform = ''
          continue
        }
        // The growth is shared between the top and the bottom edge according
        // to where the pointer is. Each share stops short of whatever lies
        // that way, and what one edge cannot take goes to the other. The
        // letter is scaled from its foot, so moving it down by the lower
        // share puts both edges where they belong.
        const growth = swell * rise * letter.height
        const wantUp = (growth * (1 - letter.pull)) / 2
        const wantDown = growth - wantUp
        const up = Math.min(wantUp, letter.up)
        const down = Math.min(wantDown, letter.down)
        const above = Math.min(up + (wantDown - down), letter.up)
        const below = Math.min(down + (wantUp - up), letter.down)
        const stretch = 1 + (above + below) / letter.height
        letter.node.style.transform =
          `translate3d(0, ${below.toFixed(2)}px, 0) ` +
          `rotate(${(2.6 * letter.lean * rise).toFixed(2)}deg) ` +
          `scale(${(1 + 0.02 * rise).toFixed(4)}, ${stretch.toFixed(4)})`
      }
      if (moving) frame = window.requestAnimationFrame(step)
      else last = 0
    }
    const run = () => {
      if (frame === 0) frame = window.requestAnimationFrame(step)
    }
    const rest = () => {
      for (const letter of letters) letter.goal = 0
      run()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (window.performance.now() < ready) return
      if (panel?.hasAttribute('data-covered')) {
        rest()
        return
      }
      if (!measured) {
        // Positions are kept between moves and read again after a scroll.
        const labels = panel?.querySelector('.hero-meta')
        const foot = panel?.querySelector('.hero-foot')
        const ceiling = labels?.getBoundingClientRect().bottom
        const floor = foot?.getBoundingClientRect().top
        // The headline's own box ends where its descenders are meant to.
        const base = root.getBoundingClientRect().bottom
        for (const letter of letters) {
          const box = letter.node.getBoundingClientRect()
          letter.x = box.left + box.width / 2
          letter.y = box.top + box.height / 2
          letter.height = Math.max(box.height, 1)
          // The first line must stay clear of the labels above it, and the
          // second of the text below it. Between themselves the two lines
          // already overlap, and may.
          letter.up =
            letter.second || ceiling === undefined
              ? Infinity
              : Math.max(box.top - ceiling - 4, 0)
          letter.down =
            letter.second && floor !== undefined
              ? Math.max(floor - base - 4, 0)
              : Infinity
        }
        measured = true
      }
      const reach = Math.max(window.innerWidth * 0.2, 180)
      for (const letter of letters) {
        const across = event.clientX - letter.x
        const down = event.clientY - letter.y
        const near = Math.max(0, 1 - Math.hypot(across, down) / reach)
        letter.goal = near * near * (3 - 2 * near)
        letter.lean = clamp(across / reach, -1, 1)
        letter.pull = clamp(down / (letter.height * 0.6), -1, 1)
      }
      run()
    }
    const forget = () => {
      measured = false
    }

    // The lines drift as the page scrolls, so their positions are read again.
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('resize', forget)
    window.addEventListener('scroll', forget, { passive: true })
    document.documentElement.addEventListener('pointerleave', rest)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('resize', forget)
      window.removeEventListener('scroll', forget)
      document.documentElement.removeEventListener('pointerleave', rest)
      window.cancelAnimationFrame(frame)
      for (const letter of letters) letter.node.style.transform = ''
      root.removeAttribute('data-kinetic')
    }
  }, [enabled, active, ref])
}

import { useEffect, type RefObject } from 'react'
import { hasFinePointer, useMotionEnabled } from './motion'

const clamp = (value: number) => Math.min(Math.max(value, -1), 1)

// Tilts a card a few degrees toward the pointer, with a soft highlight that
// follows it, and lets it settle back when the pointer leaves. Only
// transforms and opacity change. Decoration only: the card works the same
// without it.
export function useTilt(ref: RefObject<HTMLElement | null>) {
  const enabled = useMotionEnabled()

  useEffect(() => {
    const card = ref.current
    if (!card || !enabled || !hasFinePointer()) return
    const glare = card.querySelector<HTMLElement>('[data-glare]')
    // Where the pointer is across the card, from -1 to 1 each way, and
    // whether it is there at all.
    const goal = { x: 0, y: 0, on: 0 }
    const now = { x: 0, y: 0, on: 0 }
    let box: DOMRect | null = null
    let frame = 0
    let last = 0

    const step = (time: number) => {
      frame = 0
      // Eased by elapsed time, so it feels the same at any refresh rate.
      const elapsed = last === 0 ? 16 : Math.min(Math.max(time - last, 0), 64)
      last = time
      const ease = 1 - Math.exp(-elapsed / 110)
      now.x += (goal.x - now.x) * ease
      now.y += (goal.y - now.y) * ease
      now.on += (goal.on - now.on) * ease
      const apart =
        Math.abs(goal.x - now.x) +
        Math.abs(goal.y - now.y) +
        Math.abs(goal.on - now.on)
      const settled = apart < 0.002
      if (settled) Object.assign(now, goal)
      const resting = settled && now.on === 0
      card.style.transform = resting
        ? ''
        : `perspective(1400px) rotateX(${(-3.2 * now.y * now.on).toFixed(3)}deg) ` +
          `rotateY(${(4.2 * now.x * now.on).toFixed(3)}deg)`
      if (glare) {
        glare.style.opacity = (0.6 * now.on).toFixed(3)
        glare.style.translate = `${(now.x * 34).toFixed(2)}% ${(now.y * 34).toFixed(2)}%`
      }
      if (!settled) {
        frame = window.requestAnimationFrame(step)
        return
      }
      last = 0
      if (resting) card.removeAttribute('data-tilting')
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      // Measured once per visit of the pointer, while the card is at rest.
      box ??= card.getBoundingClientRect()
      goal.x = clamp(
        ((event.clientX - box.left) / Math.max(box.width, 1)) * 2 - 1,
      )
      goal.y = clamp(
        ((event.clientY - box.top) / Math.max(box.height, 1)) * 2 - 1,
      )
      goal.on = 1
      card.setAttribute('data-tilting', '')
      if (frame === 0) frame = window.requestAnimationFrame(step)
    }
    const leave = () => {
      goal.on = 0
      box = null
      if (frame === 0) frame = window.requestAnimationFrame(step)
    }
    const forget = () => {
      box = null
    }

    card.addEventListener('pointermove', move, { passive: true })
    card.addEventListener('pointerleave', leave)
    window.addEventListener('scroll', forget, { passive: true })
    window.addEventListener('resize', forget)
    return () => {
      card.removeEventListener('pointermove', move)
      card.removeEventListener('pointerleave', leave)
      window.removeEventListener('scroll', forget)
      window.removeEventListener('resize', forget)
      window.cancelAnimationFrame(frame)
      card.style.transform = ''
      card.removeAttribute('data-tilting')
      if (glare) {
        glare.style.opacity = ''
        glare.style.translate = ''
      }
    }
  }, [enabled, ref])
}

// A pool of light in the hero that drifts after the pointer. Only its
// transform changes. Decoration only.
export function useSpotlight(ref: RefObject<HTMLElement | null>) {
  const enabled = useMotionEnabled()

  useEffect(() => {
    const light = ref.current
    const panel = light?.closest<HTMLElement>('.hero-pin')
    if (!light || !panel || !enabled || !hasFinePointer()) return
    const goal = { x: 0, y: 0 }
    const now = { x: 0, y: 0 }
    let placed = false
    let frame = 0
    let last = 0

    const step = (time: number) => {
      frame = 0
      // Eased by elapsed time, so it trails the same at any refresh rate.
      const elapsed = last === 0 ? 16 : Math.min(Math.max(time - last, 0), 64)
      last = time
      const ease = 1 - Math.exp(-elapsed / 240)
      now.x += (goal.x - now.x) * ease
      now.y += (goal.y - now.y) * ease
      light.style.transform = `translate3d(${now.x.toFixed(1)}px, ${now.y.toFixed(1)}px, 0)`
      if (Math.abs(goal.x - now.x) + Math.abs(goal.y - now.y) > 0.3) {
        frame = window.requestAnimationFrame(step)
      } else {
        last = 0
      }
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if (panel.hasAttribute('data-covered')) return
      goal.x = event.clientX
      goal.y = event.clientY
      if (!placed) {
        // It appears where the pointer first is, not by sliding in.
        placed = true
        now.x = goal.x
        now.y = goal.y
        light.setAttribute('data-on', '')
      }
      if (frame === 0) frame = window.requestAnimationFrame(step)
    }

    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      window.cancelAnimationFrame(frame)
      light.removeAttribute('data-on')
      light.style.transform = ''
    }
  }, [enabled, ref])
}

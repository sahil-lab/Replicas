import { useEffect, useRef } from 'react'
import { hasFinePointer, subscribeScroll, useMotionEnabled } from './motion'

// A ring that trails the pointer and reacts to interactive elements. The
// native cursor stays visible; this is an enhancement for mouse users only.
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const enabled = useMotionEnabled()

  useEffect(() => {
    const node = ref.current
    const label = labelRef.current
    if (!node || !label || !enabled || !hasFinePointer()) return

    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    let frame = 0
    let visible = false

    const render = () => {
      frame = 0
      x += (targetX - x) * 0.22
      y += (targetY - y) * 0.22
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.2) {
        frame = window.requestAnimationFrame(render)
      }
    }
    // Shapes the ring for whatever sits under the pointer.
    const react = (element: Element | null) => {
      const target = element?.closest('[data-cursor]') ?? null
      const mode = target?.getAttribute('data-cursor') ?? ''
      if (node.dataset.mode !== mode) {
        node.dataset.mode = mode
        label.textContent = target?.getAttribute('data-cursor-label') ?? ''
      }
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      targetX = event.clientX
      targetY = event.clientY
      if (!visible) {
        visible = true
        x = targetX
        y = targetY
        node.dataset.visible = 'true'
      }
      react(event.target instanceof Element ? event.target : null)
      if (frame === 0) frame = window.requestAnimationFrame(render)
    }
    // Scrolling moves the page under a resting pointer.
    const unsubscribe = subscribeScroll(() => {
      if (visible) react(document.elementFromPoint(targetX, targetY))
    })
    const leave = () => {
      visible = false
      node.dataset.visible = 'false'
    }

    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      unsubscribe()
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      window.cancelAnimationFrame(frame)
      node.dataset.visible = 'false'
    }
  }, [enabled])

  return (
    <div className="cursor" ref={ref} aria-hidden="true">
      <span className="cursor-ring">
        <span className="cursor-label" ref={labelRef} />
      </span>
    </div>
  )
}

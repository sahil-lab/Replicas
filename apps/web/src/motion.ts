import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type RefObject,
} from 'react'
import { subscribeScroll, type ScrollFrame } from './frame'

export type Motion = 'on' | 'off'

const storageKey = 'replicas.motion'

export const MotionContext = createContext<Motion>('off')

function systemAllowsMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function readStoredMotion(): Motion {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (stored === 'on' || stored === 'off') return stored
  } catch {
    // Storage can be blocked; the system preference still applies.
  }
  return systemAllowsMotion() ? 'on' : 'off'
}

export function applyMotion(motion: Motion) {
  document.documentElement.dataset.motion = motion
}

export function useMotionSetting(): [Motion, (next: Motion) => void] {
  const [motion, setMotion] = useState<Motion>(readStoredMotion)

  useEffect(() => {
    applyMotion(motion)
  }, [motion])

  function choose(next: Motion) {
    setMotion(next)
    try {
      window.localStorage.setItem(storageKey, next)
    } catch {
      // The choice still applies for this visit.
    }
  }

  return [motion, choose]
}

export function useMotionEnabled(): boolean {
  return useContext(MotionContext) === 'on'
}

export function hasFinePointer(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

let revealObserver: IntersectionObserver | null = null

function observeReveal(node: Element) {
  revealObserver ??= new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.setAttribute('data-in', '')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  )
  revealObserver.observe(node)
}

// Marks an element with data-in once it scrolls into view. Without motion,
// or without observer support, content is marked immediately.
export function useReveal() {
  const enabled = useMotionEnabled()
  return useCallback(
    (node: Element | null) => {
      if (!node) return
      if (!enabled || typeof IntersectionObserver === 'undefined') {
        node.setAttribute('data-in', '')
        return
      }
      observeReveal(node)
      return () => {
        revealObserver?.unobserve(node)
      }
    },
    [enabled],
  )
}

// Lights the words of a paragraph one by one as it crosses the viewport.
export function useScrollWords(ref: RefObject<HTMLElement | null>) {
  const enabled = useMotionEnabled()

  useEffect(() => {
    const node = ref.current
    if (!node || !enabled) return
    const words = Array.from(node.querySelectorAll<HTMLElement>('.w'))
    let lit = 0
    // Where the paragraph sits on the page, measured only when sizes change.
    let top = 0
    let height = 0
    const measure = () => {
      const rect = node.getBoundingClientRect()
      top = rect.top + window.scrollY
      height = rect.height
    }
    const update = (frame: ScrollFrame) => {
      const start = frame.height * 0.86
      const end = frame.height * 0.4
      const progress = clamp(
        (start - (top - frame.y)) / (height + start - end),
        0,
        1,
      )
      const next = Math.round(progress * words.length)
      if (next === lit) return
      const from = Math.min(lit, next)
      const to = Math.max(lit, next)
      for (let index = from; index < to; index += 1) {
        words[index]?.toggleAttribute('data-lit', next > lit)
      }
      lit = next
    }
    const unsubscribe = subscribeScroll(update, measure)
    return () => {
      unsubscribe()
      for (const word of words) word.removeAttribute('data-lit')
    }
  }, [enabled, ref])
}

// Pulls an element a little toward the pointer while it hovers nearby.
export function useMagnetic(strength = 0.3) {
  const enabled = useMotionEnabled()
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node || !enabled || !hasFinePointer()) return
      const move = (event: PointerEvent) => {
        const rect = node.getBoundingClientRect()
        const x = event.clientX - (rect.left + rect.width / 2)
        const y = event.clientY - (rect.top + rect.height / 2)
        node.style.translate = `${(x * strength).toFixed(1)}px ${(y * strength).toFixed(1)}px`
      }
      const leave = () => {
        node.style.translate = ''
      }
      node.addEventListener('pointermove', move)
      node.addEventListener('pointerleave', leave)
      return () => {
        node.removeEventListener('pointermove', move)
        node.removeEventListener('pointerleave', leave)
        node.style.translate = ''
      }
    },
    [enabled, strength],
  )
}

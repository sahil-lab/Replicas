import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useMotionEnabled } from './motion'

export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#15101c" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M16 17.5 5.5 22.5 16 27.5l10.5-5z" fill="#8f73f2" />
        <path d="M16 11 5.5 16 16 21l10.5-5z" fill="#ff7a5c" />
        <path d="M16 4.5 5.5 9.5 16 14.5l10.5-5z" fill="#d6f25a" />
      </g>
    </svg>
  )
}

export function Star() {
  return (
    <svg
      className="star"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 1.5c.6 5.6 4.9 9.9 10.5 10.5-5.6.6-9.9 4.9-10.5 10.5-.6-5.6-4.9-9.9-10.5-10.5 5.6-.6 9.9-4.9 10.5-10.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

// Words rise from a mask one after another. The parent supplies the full
// text to assistive technology.
export function Words({ text }: { text: string }) {
  const words = text.split(' ')
  return (
    <span className="words" aria-hidden="true">
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="word-mask">
            <span className="word" style={{ '--i': index } as CSSProperties}>
              {word}
            </span>
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  )
}

// A seamless horizontal loop. Only the first copy is exposed to assistive
// technology; the rest are decorative repeats.
export function Marquee({
  children,
  className,
  copies = 4,
  decorative = false,
}: {
  children: ReactNode
  className?: string
  copies?: number
  decorative?: boolean
}) {
  return (
    <div
      className={className ? `marquee ${className}` : 'marquee'}
      aria-hidden={decorative ? true : undefined}
    >
      <div
        className="marquee-track"
        style={{ '--copies': copies } as CSSProperties}
      >
        {Array.from({ length: copies }, (_, index) => (
          <div
            className="marquee-group"
            key={index}
            aria-hidden={index > 0 ? true : undefined}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}

// Text set around a circle, used for rotating badges.
export function RingText({ id, text }: { id: string; text: string }) {
  return (
    <svg
      className="ring-text"
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={id} d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0" />
      </defs>
      <text>
        <textPath href={`#${id}`} textLength="236">
          {text}
        </textPath>
      </text>
    </svg>
  )
}

// Counts up to a measured value the first time it scrolls into view, and
// again whenever the value changes. Without motion it shows the value.
export function CountUp({ value }: { value: number }) {
  const motion = useMotionEnabled()
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )
  const [shown, setShown] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node || !motion || seen) return
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setSeen(true)
        observer.disconnect()
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [motion, seen])

  useEffect(() => {
    if (!motion || !seen) return
    const started = window.performance.now()
    let frame = 0
    const step = (now: number) => {
      const progress = Math.min((now - started) / 1100, 1)
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 4))))
      if (progress < 1) frame = window.requestAnimationFrame(step)
    }
    frame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(frame)
  }, [motion, seen, value])

  return <span ref={ref}>{motion ? shown : value}</span>
}

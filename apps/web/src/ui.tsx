import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { subscribeVelocity } from './frame'
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

// The same, letter by letter, so each glyph can move and change weight on
// its own. Kerning between letters is given up for that.
export function Letters({ text }: { text: string }) {
  const words = text.split(' ')
  const starts = words.map((_, index) =>
    words.slice(0, index).reduce((total, word) => total + word.length, 0),
  )
  return (
    <span className="words" aria-hidden="true">
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="word-mask">
            {Array.from(word, (letter, offset) => (
              <span
                className="ch"
                key={offset}
                style={
                  { '--i': (starts[index] ?? 0) + offset } as CSSProperties
                }
              >
                {letter}
              </span>
            ))}
          </span>
          {index < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  )
}

// A section heading whose words rise into place when it is revealed.
export function Heading({ id, text }: { id: string; text: string }) {
  return (
    <h2 id={id} aria-label={text}>
      <Words text={text} />
    </h2>
  )
}

const glyphs = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/+=<>'

// A short label that resolves out of scrambled characters when it first
// scrolls into view. Assistive technology always gets the plain text.
export function Decode({
  text,
  active = true,
}: {
  text: string
  active?: boolean
}) {
  const motion = useMotionEnabled()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const label = ref.current?.firstChild
    if (!label || !ref.current || !active) return
    if (!motion || typeof IntersectionObserver === 'undefined') return
    let frame = 0
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        const started = window.performance.now()
        let painted = 0
        const step = (now: number) => {
          // A frame's timestamp can be earlier than the start just taken.
          const progress = Math.min(Math.max((now - started) / 900, 0), 1)
          // Changing text means laying it out again, so it changes about
          // twenty times a second instead of on every frame.
          if (progress >= 1 || now - painted >= 45) {
            painted = now
            const settled = Math.floor(progress * text.length)
            let shown = ''
            for (let index = 0; index < text.length; index += 1) {
              const letter = text.charAt(index)
              shown +=
                index < settled || letter === ' '
                  ? letter
                  : glyphs.charAt(Math.floor(Math.random() * glyphs.length))
            }
            label.nodeValue = shown
          }
          frame = progress < 1 ? window.requestAnimationFrame(step) : 0
        }
        frame = window.requestAnimationFrame(step)
      },
      { threshold: 0.5 },
    )
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      window.cancelAnimationFrame(frame)
      label.nodeValue = text
    }
  }, [motion, text, active])

  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="decode" ref={ref} aria-hidden="true">
        {text}
      </span>
    </>
  )
}

// A seamless horizontal loop that speeds up with the scroll and follows its
// direction. Only the first copy is exposed to assistive technology; the
// rest are decorative repeats.
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
  const motion = useMotionEnabled()
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track || !motion || typeof track.getAnimations !== 'function') return
    // Asking a CSS animation about itself makes the browser bring every
    // style up to date first. So it is looked up once, and only asked for
    // its position at the moment the direction turns.
    let animation: Animation | undefined
    let duration = 0
    let direction = 1
    return subscribeVelocity((velocity) => {
      if (!animation) {
        animation = track.getAnimations()[0]
        const length = animation?.effect?.getComputedTiming().duration
        duration = typeof length === 'number' ? length : 0
      }
      if (!animation) return
      const before = direction
      if (velocity > 0.02) direction = 1
      else if (velocity < -0.02) direction = -1
      if (direction < 0 && before > 0 && duration > 0) {
        // Playing backwards stops at the start, so a long runway is put
        // behind it as it turns.
        animation.currentTime =
          Number(animation.currentTime ?? 0) + duration * 400
      }
      animation.updatePlaybackRate(
        direction * (1 + Math.min(Math.abs(velocity) * 2.4, 6)),
      )
      // The line leans against the direction of travel, like something with
      // weight, and stands up again when the page comes to rest.
      const lean = Math.min(Math.max(velocity * -3, -6), 6)
      track.style.transform =
        Math.abs(lean) < 0.05 ? '' : `skewX(${lean.toFixed(2)}deg)`
    })
  }, [motion])

  return (
    <div
      className={className ? `marquee ${className}` : 'marquee'}
      aria-hidden={decorative ? true : undefined}
    >
      <div
        className="marquee-track"
        ref={trackRef}
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

// Each column of the counter holds the digits twice over, so a column can
// turn through a full round on its way to the digit it shows.
const counterRows = Array.from({ length: 20 }, (_, row) => row % 10)

// A measured number whose digits roll into place like a mechanical counter,
// the first time it scrolls into view and again whenever it changes. Each
// column slides as a whole, so nothing is laid out again while it turns.
// Without motion, and for assistive technology, it is the plain number.
export function Odometer({ value }: { value: number }) {
  const motion = useMotionEnabled()
  const ref = useRef<HTMLSpanElement>(null)
  const [seen, setSeen] = useState(
    () => typeof IntersectionObserver === 'undefined',
  )
  const text = String(Math.max(0, Math.round(value)))

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

  if (!motion) return <span ref={ref}>{text}</span>

  return (
    <span className="odometer" ref={ref}>
      <span className="sr-only">{text}</span>
      <span className="odometer-digits" aria-hidden="true">
        {Array.from(text, (digit, index) => {
          // Counted from the right, so the units stay the units when the
          // number gains or loses a digit.
          const place = text.length - index
          return (
            <span
              className="odometer-column"
              key={place}
              style={
                {
                  '--d': seen ? 10 + Number(digit) : 0,
                  '--k': place - 1,
                } as CSSProperties
              }
            >
              <span className="odometer-ghost">0</span>
              <span className="odometer-strip">
                {counterRows.map((row, at) => (
                  <span key={at}>{row}</span>
                ))}
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}

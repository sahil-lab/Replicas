import type { ReactNode } from 'react'

type Tone = 'citron' | 'coral' | 'violet'

const CENTER = 300
const HALF_WIDTH = 170
const HALF_HEIGHT = 96
const CORNER = 0.34
const THICKNESS = 18
// Half-width of a rounded face along its widest line.
const REACH = HALF_WIDTH * (1 - 0.2929 * CORNER)

// Maps a flat square (-1..1) onto the isometric plane centred at centerY.
function isometric(centerY: number) {
  const x = HALF_WIDTH / 2
  const y = HALF_HEIGHT / 2
  return `matrix(${x} ${y} ${-x} ${y} ${CENTER} ${centerY})`
}

function Plate({
  centerY,
  tone,
  children,
}: {
  centerY: number
  tone: Tone
  children?: ReactNode
}) {
  const face = isometric(centerY)
  const base = isometric(centerY + THICKNESS)
  return (
    <g className={`plate plate-${tone}`}>
      <clipPath id={`art-side-${tone}`}>
        <rect
          x={CENTER - REACH}
          y={centerY}
          width={REACH * 2}
          height={THICKNESS}
        />
        <rect x="-1" y="-1" width="2" height="2" rx={CORNER} transform={base} />
      </clipPath>
      <g className="plate-side">
        <rect
          x={CENTER - REACH}
          y={centerY}
          width={REACH * 2}
          height={THICKNESS}
        />
        <rect x="-1" y="-1" width="2" height="2" rx={CORNER} transform={base} />
      </g>
      <rect
        className="plate-shade"
        x={CENTER}
        y={centerY - HALF_HEIGHT}
        width={HALF_WIDTH}
        height={HALF_HEIGHT * 2 + THICKNESS}
        clipPath={`url(#art-side-${tone})`}
      />
      <rect
        x="-1"
        y="-1"
        width="2"
        height="2"
        rx={CORNER}
        transform={face}
        fill={`url(#art-face-${tone})`}
      />
      <rect
        className="plate-rim"
        x="-1"
        y="-1"
        width="2"
        height="2"
        rx={CORNER}
        transform={face}
        vectorEffect="non-scaling-stroke"
      />
      {children}
    </g>
  )
}

// A flat drawing of the stack, shown where the real-time sculpture cannot
// run: browsers without WebGL, or after the graphics context is lost.
export function StackIllustration({
  state,
}: {
  state: 'loading' | 'ready' | 'error'
}) {
  return (
    <svg
      className="stack-art"
      data-state={state}
      viewBox="0 0 600 500"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="art-glow">
          <stop offset="0" stopColor="#d6f25a" stopOpacity="0.28" />
          <stop offset="0.55" stopColor="#8f73f2" stopOpacity="0.14" />
          <stop offset="1" stopColor="#8f73f2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="art-face-citron" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1fbb4" />
          <stop offset="1" stopColor="#c5e23c" />
        </linearGradient>
        <linearGradient id="art-face-coral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffc2b1" />
          <stop offset="1" stopColor="#f46a4b" />
        </linearGradient>
        <linearGradient id="art-face-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#cbbcff" />
          <stop offset="1" stopColor="#7a5ce6" />
        </linearGradient>
        <filter id="art-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>

      <circle cx={CENTER} cy="246" r="226" fill="url(#art-glow)" />
      <ellipse
        className="art-shadow"
        cx={CENTER}
        cy="418"
        rx="188"
        ry="40"
        filter="url(#art-blur)"
      />

      <g className="plates">
        <Plate centerY={318} tone="violet" />
        <path
          className="pillar"
          d={`M${CENTER - REACH} 270V318M${CENTER + REACH} 270V318`}
        />
        <Plate centerY={252} tone="coral" />
        <path
          className="pillar"
          d={`M${CENTER - REACH} 204V252M${CENTER + REACH} 204V252`}
        />
        <Plate centerY={186} tone="citron">
          <rect
            className="plate-inset"
            x="-0.72"
            y="-0.72"
            width="1.44"
            height="1.44"
            rx="0.2"
            transform={isometric(186)}
            vectorEffect="non-scaling-stroke"
          />
        </Plate>
      </g>
    </svg>
  )
}

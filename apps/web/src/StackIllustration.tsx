import type { ReactNode } from 'react'

type Tone = 'citron' | 'coral' | 'lavender'

const CENTER = 300
const HALF_WIDTH = 170
const HALF_HEIGHT = 96
const CORNER = 0.34
const THICKNESS = 18
const RING_Y = 262
// Half-width of a rounded face along its widest line.
const REACH = HALF_WIDTH * (1 - 0.2929 * CORNER)

const orbits = [
  {
    name: 'a',
    rotate: -12,
    rx: 262,
    ry: 104,
    radius: 5,
    duration: '18s',
    tone: 'citron',
    rest: 0.72,
  },
  {
    name: 'b',
    rotate: 8,
    rx: 286,
    ry: 150,
    radius: 3.5,
    duration: '30s',
    tone: 'coral',
    rest: 3.6,
  },
] as const

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

function Leds({ centerY }: { centerY: number }) {
  return (
    <g transform={isometric(centerY)}>
      <circle className="led led-on" cx="0.8" cy="0.2" r="0.05" />
      <circle className="led" cx="0.8" cy="0.38" r="0.05" />
      <circle className="led" cx="0.8" cy="0.56" r="0.05" />
      <path className="slot" d="M0.18 0.8H0.56" />
    </g>
  )
}

function OrbitLayer({ clip }: { clip: 'back' | 'front' }) {
  return (
    <g>
      {orbits.map((orbit) => {
        const start = CENTER - orbit.rx
        const span = orbit.rx * 2
        const motion = `M${start} ${RING_Y}a${orbit.rx} ${orbit.ry} 0 1 0 ${span} 0a${orbit.rx} ${orbit.ry} 0 1 0 ${-span} 0`
        return (
          <g
            key={orbit.name}
            transform={`rotate(${orbit.rotate} ${CENTER} ${RING_Y})`}
          >
            <g clipPath={`url(#art-${clip})`}>
              <ellipse
                className={`orbit orbit-${orbit.name}`}
                cx={CENTER}
                cy={RING_Y}
                rx={orbit.rx}
                ry={orbit.ry}
              />
              <circle
                className={`satellite fill-${orbit.tone}`}
                r={orbit.radius}
              >
                <animateMotion
                  dur={orbit.duration}
                  repeatCount="indefinite"
                  path={motion}
                />
              </circle>
              <circle
                className={`satellite-rest fill-${orbit.tone}`}
                r={orbit.radius}
                cx={CENTER + orbit.rx * Math.cos(orbit.rest)}
                cy={RING_Y + orbit.ry * Math.sin(orbit.rest)}
              />
            </g>
          </g>
        )
      })}
    </g>
  )
}

function Chip({
  x,
  y,
  width,
  text,
  lead,
}: {
  x: number
  y: number
  width: number
  text: string
  lead: string
}) {
  return (
    <g className="art-chip">
      <path className="art-lead" d={lead} />
      <rect x={x} y={y} width={width} height="28" rx="14" />
      <circle className="art-dot" cx={x + 14} cy={y + 14} r="3" />
      <text x={x + 24} y={y + 18.6}>
        {text}
      </text>
    </g>
  )
}

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
          <stop offset="0" stopColor="#dcea8b" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#b79be0" stopOpacity="0.12" />
          <stop offset="1" stopColor="#b79be0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="art-face-citron" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5fad2" />
          <stop offset="1" stopColor="#cbdd72" />
        </linearGradient>
        <linearGradient id="art-face-coral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fcd8cb" />
          <stop offset="1" stopColor="#e4917c" />
        </linearGradient>
        <linearGradient id="art-face-lavender" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dfd1f5" />
          <stop offset="1" stopColor="#9c80ca" />
        </linearGradient>
        <filter id="art-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <clipPath id="art-back">
          <rect x="-200" y="-400" width="1000" height={RING_Y + 400} />
        </clipPath>
        <clipPath id="art-front">
          <rect x="-200" y={RING_Y} width="1000" height="700" />
        </clipPath>
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

      <OrbitLayer clip="back" />

      <g className="plates">
        <Plate centerY={318} tone="lavender">
          <Leds centerY={318} />
        </Plate>
        <path
          className="pillar"
          d={`M${CENTER - REACH} 270V318M${CENTER + REACH} 270V318`}
        />
        <Plate centerY={252} tone="coral">
          <Leds centerY={252} />
        </Plate>
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
          <g className="emblem">
            <path d="M300 160l30 17-30 17-30-17z" />
            <path d="M270 189l30 17 30-17" />
            <path d="M270 201l30 17 30-17" />
          </g>
        </Plate>
      </g>

      <OrbitLayer clip="front" />

      <Chip
        x={466}
        y={132}
        width={126}
        text="01 GATEWAY"
        lead="M458 179L484 160"
      />
      <Chip x={10} y={264} width={91} text="02 API" lead="M141 259L101 276" />
      <Chip
        x={460}
        y={342}
        width={135}
        text="03 POSTGRES"
        lead="M459 325L482 342"
      />

      <path className="spark spark-coral" d="M84 116v16M76 124h16" />
      <path className="spark spark-citron" d="M532 424v12M526 430h12" />
      <circle className="spark-dot" cx="548" cy="88" r="2.5" />
      <circle className="spark-dot" cx="60" cy="372" r="2" />
    </svg>
  )
}

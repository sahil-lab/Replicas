import type { CSSProperties } from 'react'

type Props = {
  count: number
  width: number
  state: 'loading' | 'ready' | 'error'
  // Lights the plates once, from the bottom up.
  pulse?: boolean
}

const CENTRE_X = 200
const CENTRE_Y = 204
const HALF_EXTENT = 102
const SQUASH = 0.47
const SPACING = 9.6
const TWIST = 5.5

const stops: readonly (readonly [number, number, number])[] = [
  [122, 92, 230],
  [255, 106, 75],
  [197, 226, 60],
]

// Violet at the bottom, coral in the middle, citron on top.
function tint(level: number) {
  const scaled = Math.min(Math.max(level, 0), 1) * (stops.length - 1)
  const index = Math.min(Math.floor(scaled), stops.length - 2)
  const from = stops[index] ?? [0, 0, 0]
  const to = stops[index + 1] ?? from
  const channels = from.map((value, channel) =>
    Math.round(value + ((to[channel] ?? value) - value) * (scaled - index)),
  )
  return `rgb(${channels.join(' ')})`
}

// A flat drawing of the stack: one outlined plate per level. It stands in
// for the real-time sculpture wherever WebGL cannot run or would be slow.
export function StackSchematic({ count, width, state, pulse }: Props) {
  const plates = Math.max(1, Math.round(count))
  const centre = (plates - 1) / 2
  const k = (HALF_EXTENT * Math.min(Math.max(width, 0.2), 1)) / 2
  const across = k.toFixed(2)
  const down = (k * SQUASH).toFixed(2)

  return (
    <svg
      className="schematic"
      data-state={state}
      data-pulse={pulse}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse
        className="schematic-shadow"
        cx={CENTRE_X}
        cy={CENTRE_Y + centre * SPACING + k * 2 * SQUASH + 16}
        rx={k * 2.1}
        ry={k * 0.6}
      />
      {Array.from({ length: plates }, (_, index) => {
        const offset = index - centre
        const top = index === plates - 1
        const colour = tint(plates > 1 ? index / (plates - 1) : 1)
        const style = {
          '--p': index,
          transform: `matrix(${across}, ${down}, -${across}, ${down}, ${CENTRE_X}, ${(CENTRE_Y - offset * SPACING).toFixed(2)}) rotate(${(offset * TWIST).toFixed(2)}deg)`,
          stroke: colour,
          fill: top ? colour : undefined,
        } as CSSProperties
        return (
          <rect
            key={index}
            className={
              top ? 'schematic-plate schematic-top' : 'schematic-plate'
            }
            x="-1"
            y="-1"
            width="2"
            height="2"
            rx="0.32"
            style={style}
          />
        )
      })}
    </svg>
  )
}

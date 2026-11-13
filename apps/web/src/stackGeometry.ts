// Geometry and camera for the stack of plates. Every plate is a thin rounded
// slab made of a rim of light, a side wall and a top face. Plates are laid
// out bottom first, so a single draw call paints them in the right order
// without a depth buffer.

export const MAX_PLATES = 21
// Corner radius as a fraction of a plate's half-width.
export const CORNER = 0.306
// The shadow under the stack is one more quad, drawn before any plate.
export const FLOATS_PER_VERTEX = 7
export const MOTE_COUNT = 96

const ARC_STEPS = 6
const GLOW_KIND = 0
const SIDE_KIND = 1
const TOP_KIND = 2
const SHADOW_KIND = 3

// Each vertex: position on the plate (x, y, z), outward normal (x, z), the
// plate's index, and which part of the plate it belongs to.
export function buildPlates(): Float32Array {
  const vertices: number[] = []
  const push = (
    x: number,
    y: number,
    z: number,
    normalX: number,
    normalZ: number,
    plate: number,
    kind: number,
  ) => {
    vertices.push(x, y, z, normalX, normalZ, plate, kind)
  }
  const quad = (extent: number, y: number, plate: number, kind: number) => {
    push(-extent, y, -extent, 0, 0, plate, kind)
    push(extent, y, -extent, 0, 0, plate, kind)
    push(extent, y, extent, 0, 0, plate, kind)
    push(-extent, y, -extent, 0, 0, plate, kind)
    push(extent, y, extent, 0, 0, plate, kind)
    push(-extent, y, extent, 0, 0, plate, kind)
  }

  // The outline of a rounded square: a quarter circle at each corner.
  const outline: { x: number; z: number; normalX: number; normalZ: number }[] =
    []
  const corners = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ] as const
  corners.forEach(([signX, signZ], corner) => {
    for (let step = 0; step <= ARC_STEPS; step += 1) {
      const angle = ((corner + step / ARC_STEPS) * Math.PI) / 2
      const normalX = Math.cos(angle)
      const normalZ = Math.sin(angle)
      outline.push({
        x: signX * (1 - CORNER) + CORNER * normalX,
        z: signZ * (1 - CORNER) + CORNER * normalZ,
        normalX,
        normalZ,
      })
    }
  })

  quad(1, 0, 0, SHADOW_KIND)
  for (let plate = 0; plate < MAX_PLATES; plate += 1) {
    // Light leaving the rim: a narrow band around the outline. Its height
    // slot says how far out a vertex sits, 0 on the rim and 1 at the far
    // edge, and the shader pushes it out along the normal. A band is drawn
    // instead of a sheet over the whole plate because overlapping sheets are
    // what an integrated GPU is slowest at.
    outline.forEach((from, index) => {
      const to = outline[(index + 1) % outline.length] ?? from
      push(from.x, 0, from.z, from.normalX, from.normalZ, plate, GLOW_KIND)
      push(to.x, 0, to.z, to.normalX, to.normalZ, plate, GLOW_KIND)
      push(to.x, 1, to.z, to.normalX, to.normalZ, plate, GLOW_KIND)
      push(from.x, 0, from.z, from.normalX, from.normalZ, plate, GLOW_KIND)
      push(to.x, 1, to.z, to.normalX, to.normalZ, plate, GLOW_KIND)
      push(from.x, 1, from.z, from.normalX, from.normalZ, plate, GLOW_KIND)
    })
    outline.forEach((from, index) => {
      const to = outline[(index + 1) % outline.length] ?? from
      push(from.x, -1, from.z, from.normalX, from.normalZ, plate, SIDE_KIND)
      push(to.x, -1, to.z, to.normalX, to.normalZ, plate, SIDE_KIND)
      push(to.x, 1, to.z, to.normalX, to.normalZ, plate, SIDE_KIND)
      push(from.x, -1, from.z, from.normalX, from.normalZ, plate, SIDE_KIND)
      push(to.x, 1, to.z, to.normalX, to.normalZ, plate, SIDE_KIND)
      push(from.x, 1, from.z, from.normalX, from.normalZ, plate, SIDE_KIND)
    })
    // A little larger than the plate, so its edge can be drawn soft.
    quad(1.04, 1, plate, TOP_KIND)
  }
  return new Float32Array(vertices)
}

// Specks of light that drift around the stack: an angle, a distance from the
// axis, a starting height, and a number that makes each one behave its own way.
export function buildMotes(): Float32Array {
  const seeds = new Float32Array(MOTE_COUNT * 4)
  // A small fixed generator, so the specks are the same on every visit.
  let state = 0x2f6e2b1
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0xffffffff
  }
  for (let mote = 0; mote < MOTE_COUNT; mote += 1) {
    seeds[mote * 4] = next() * Math.PI * 2
    seeds[mote * 4 + 1] = 0.95 + next() * 0.95
    seeds[mote * 4 + 2] = next()
    seeds[mote * 4 + 3] = next()
  }
  return seeds
}

export type Camera = {
  // Column-major, ready for the shader.
  matrix: Float32Array
  eye: [number, number, number]
  forward: [number, number, number]
}

// A camera that circles the origin and looks at it. The picture is square, so
// the focal length alone sets the field of view.
export function orbitCamera(
  yaw: number,
  pitch: number,
  distance: number,
  focal: number,
): Camera {
  const eyeX = Math.sin(yaw) * Math.cos(pitch) * distance
  const eyeY = Math.sin(pitch) * distance
  const eyeZ = Math.cos(yaw) * Math.cos(pitch) * distance
  // Forward points from the eye to the origin.
  const forwardX = -eyeX / distance
  const forwardY = -eyeY / distance
  const forwardZ = -eyeZ / distance
  // right = forward x up, for an up vector of (0, 1, 0).
  const rightLength = Math.hypot(forwardZ, forwardX) || 1
  const rightX = -forwardZ / rightLength
  const rightZ = forwardX / rightLength
  // up = right x forward.
  const upX = -rightZ * forwardY
  const upY = rightZ * forwardX - rightX * forwardZ
  const upZ = rightX * forwardY

  const near = 0.5
  const far = 40
  const depth = (far + near) / (near - far)
  const offset = (2 * far * near) / (near - far)
  // In camera space x is right, y is up and the view runs along -z.
  // clip = projection * view, written out for the fixed target at the origin.
  const viewZ = distance
  const matrix = new Float32Array([
    focal * rightX,
    focal * upX,
    -depth * forwardX,
    forwardX,
    0,
    focal * upY,
    -depth * forwardY,
    forwardY,
    focal * rightZ,
    focal * upZ,
    -depth * forwardZ,
    forwardZ,
    0,
    0,
    -depth * viewZ + offset,
    viewZ,
  ])
  return {
    matrix,
    eye: [eyeX, eyeY, eyeZ],
    forward: [forwardX, forwardY, forwardZ],
  }
}

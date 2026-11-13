import type { SystemStatus } from './api'
import type { IconName } from './Icon'

export type SystemState =
  | { status: 'loading' }
  | { status: 'ready'; data: SystemStatus; elapsedMs: number; checkedAt: Date }
  | { status: 'error'; message: string }

export type PreflightFailure = {
  message: string
  status: number | null
  fields: Record<string, string>
}

export type CopyState = 'idle' | 'copied' | 'failed'

export const sections = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'preflight', label: 'Preflight', icon: 'sliders' },
  { id: 'foundation', label: 'System health', icon: 'pulse' },
  { id: 'roadmap', label: 'Roadmap', icon: 'layers' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[]

export type SectionId = (typeof sections)[number]['id']

export const sectionIds: readonly SectionId[] = sections.map(
  (section) => section.id,
)

export const limits = {
  label: 80,
  timeout: { min: 1, max: 900 },
  memory: { min: 128, max: 2048 },
} as const

// One metadata request measured during this visit.
export type Sample = { ms: number } | { failed: true }

function fraction(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, (value - min) / (max - min)))
}

// The drawing in the preflight instrument: more time, more plates; more
// memory, wider plates. Values outside the contract park at the nearest end,
// so the drawing never judges validity. Only the API does that.
export function stackShape(timeoutSeconds: number, memoryMiB: number) {
  const time = fraction(timeoutSeconds, limits.timeout.min, limits.timeout.max)
  const memory = fraction(memoryMiB, limits.memory.min, limits.memory.max)
  return {
    time,
    memory,
    count: Math.round(6 + 15 * time),
    width: 0.62 + 0.38 * memory,
  }
}

export function formatMs(value: number) {
  return `${Math.max(1, Math.round(value))} ms`
}

export function stackSummary(system: SystemState) {
  if (system.status === 'ready') {
    return {
      value: 'Connected',
      pill: 'Stack online',
      note: `${formatMs(system.elapsedMs)} round trip`,
    }
  }
  if (system.status === 'loading') {
    return {
      value: 'Checking...',
      pill: 'Checking stack',
      note: 'Requesting metadata',
    }
  }
  return {
    value: 'Unavailable',
    pill: 'Stack offline',
    note: 'Last request failed',
  }
}

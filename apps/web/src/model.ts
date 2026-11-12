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

import { z } from 'zod'

const systemSchema = z
  .object({
    service: z.literal('replicas-orchestrator'),
    phase: z.literal('phase-1'),
    database: z.literal('up'),
    installationId: z.uuid(),
    createdAt: z.iso.datetime(),
    schemaVersion: z.literal(1),
  })
  .strict()

const preflightSchema = z
  .object({
    valid: z.literal(true),
    executionEnabled: z.literal(false),
    label: z.string().min(1).max(80),
  })
  .strict()

const problemSchema = z.object({
  detail: z.string().min(1).max(512),
  errors: z.record(z.string(), z.string()).optional(),
})

export type SystemStatus = z.infer<typeof systemSchema>
export type PreflightResult = z.infer<typeof preflightSchema>
export type PreflightRequest = {
  label: string
  timeoutSeconds: number
  memoryMiB: number
}
export type PreflightOutcome = { status: number; data: PreflightResult }

export class ApiError extends Error {
  readonly status: number
  readonly fields: Record<string, string>

  constructor(
    message: string,
    status: number,
    fields: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestInit = {},
): Promise<{ status: number; data: T }> {
  const timeout = AbortSignal.timeout(10_000)
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout
  const response = await fetch(path, { ...options, signal })
  const body: unknown = await response.json()
  if (!response.ok) {
    const problem = problemSchema.safeParse(body)
    if (problem.success) {
      throw new ApiError(
        problem.data.detail,
        response.status,
        problem.data.errors,
      )
    }
    throw new ApiError(
      `Request failed (HTTP ${response.status}).`,
      response.status,
    )
  }
  return { status: response.status, data: schema.parse(body) }
}

export async function getSystem(signal?: AbortSignal): Promise<SystemStatus> {
  const { data } = await request('/api/v1/system', systemSchema, { signal })
  return data
}

export function checkPreflight(
  configuration: PreflightRequest,
): Promise<PreflightOutcome> {
  return request('/api/v1/preflight', preflightSchema, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configuration),
  })
}

export function errorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return 'The server response did not match the API contract.'
  }
  if (error instanceof SyntaxError) {
    return 'The server returned an unreadable response.'
  }
  if (error instanceof TypeError) {
    return 'Cannot reach the API. Check the local stack and retry.'
  }
  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'The request timed out. Check the local stack and retry.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected request error occurred. Check the local stack and retry.'
}

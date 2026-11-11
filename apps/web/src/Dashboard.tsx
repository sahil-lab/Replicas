import { Fragment, useEffect, useState, type FormEvent } from 'react'
import {
  ApiError,
  checkPreflight,
  errorMessage,
  getSystem,
  type PreflightOutcome,
  type SystemStatus,
} from './api'
import { Icon, type IconName } from './Icon'
import { StackIllustration } from './StackIllustration'
import { useTheme } from './theme'
import { useActiveSection } from './useActiveSection'

type SystemState =
  | { status: 'loading' }
  | { status: 'ready'; data: SystemStatus; elapsedMs: number; checkedAt: Date }
  | { status: 'error'; message: string }

type PreflightFailure = {
  message: string
  status: number | null
  fields: Record<string, string>
}

type Tone = 'citron' | 'coral' | 'lavender'
type CopyState = 'idle' | 'copied' | 'failed'

const sections = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'preflight', label: 'Preflight', icon: 'sliders' },
  { id: 'foundation', label: 'System health', icon: 'pulse' },
  { id: 'roadmap', label: 'Roadmap', icon: 'layers' },
] as const satisfies readonly { id: string; label: string; icon: IconName }[]

const sectionIds = sections.map((section) => section.id)

const limits = {
  label: 80,
  timeout: { min: 1, max: 900 },
  memory: { min: 128, max: 2048 },
} as const

function formatMs(value: number) {
  return `${Math.max(1, Math.round(value))} ms`
}

function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <g stroke="#1b1525" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M16 17.5 5.5 22.5 16 27.5l10.5-5z" fill="#bda9e0" />
        <path d="M16 11 5.5 16 16 21l10.5-5z" fill="#f3a896" />
        <path d="M16 4.5 5.5 9.5 16 14.5l10.5-5z" fill="#dcea8b" />
      </g>
    </svg>
  )
}

function Tile({
  icon,
  tone,
  label,
  value,
  note,
  state,
}: {
  icon: IconName
  tone: Tone
  label: string
  value: string
  note: string
  state?: SystemState['status']
}) {
  return (
    <div className="tile" data-state={state}>
      <div className="tile-top">
        <span className={`icon-tile tone-${tone}`}>
          <Icon name={icon} />
        </span>
        <span className="tile-label">{label}</span>
      </div>
      <strong className="tile-value">{value}</strong>
      <span className="tile-note">{note}</span>
    </div>
  )
}

function RangeMeter({
  value,
  min,
  max,
}: {
  value: number
  min: number
  max: number
}) {
  const inRange = Number.isInteger(value) && value >= min && value <= max
  const ratio = Number.isFinite(value)
    ? Math.min(1, Math.max(0, (value - min) / (max - min)))
    : 0
  return (
    <svg
      className={inRange ? 'meter' : 'meter out'}
      aria-hidden="true"
      focusable="false"
    >
      <rect className="meter-track" width="100%" height="6" rx="3" />
      <rect
        className="meter-fill"
        width={`${Math.max(2, ratio * 100).toFixed(2)}%`}
        height="6"
        rx="3"
      />
    </svg>
  )
}

function tokenClass(value: unknown) {
  if (typeof value === 'string') return 'tok-string'
  if (typeof value === 'number' && Number.isFinite(value)) return 'tok-number'
  if (typeof value === 'boolean') return 'tok-bool'
  return 'tok-null'
}

function JsonBlock({ value }: { value: Record<string, unknown> }) {
  const entries = Object.entries(value)
  return (
    <pre className="code">
      <code>
        <span className="tok-punct">{'{'}</span>
        {'\n'}
        {entries.map(([key, entry], index) => (
          <Fragment key={key}>
            {'  '}
            <span className="tok-key">{JSON.stringify(key)}</span>
            <span className="tok-punct">: </span>
            <span className={tokenClass(entry)}>
              {JSON.stringify(entry) ?? 'null'}
            </span>
            {index < entries.length - 1 && <span className="tok-punct">,</span>}
            {'\n'}
          </Fragment>
        ))}
        <span className="tok-punct">{'}'}</span>
      </code>
    </pre>
  )
}

function PathNode({
  icon,
  name,
  note,
  verified,
}: {
  icon: IconName
  name: string
  note: string
  verified: boolean
}) {
  return (
    <li className="path-node" data-verified={verified}>
      <span className="path-icon">
        <Icon name={icon} size={20} />
      </span>
      <span className="path-text">
        <strong>{name}</strong>
        <span>{note}</span>
      </span>
      <span className="path-mark">
        <Icon name={verified ? 'check' : 'minus'} size={13} />
        <span className="sr-only">
          {verified ? 'Verified' : 'Not verified'}
        </span>
      </span>
    </li>
  )
}

export default function Dashboard() {
  const [theme, chooseTheme] = useTheme()
  const activeSection = useActiveSection(sectionIds, 'overview')
  const [system, setSystem] = useState<SystemState>({ status: 'loading' })
  const [reload, setReload] = useState(0)
  const [label, setLabel] = useState('synthetic-demo')
  const [timeout, setTimeoutValue] = useState('300')
  const [memory, setMemory] = useState('512')
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<PreflightOutcome | null>(null)
  const [failure, setFailure] = useState<PreflightFailure | null>(null)
  const [copyState, setCopyState] = useState<CopyState>('idle')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const started = performance.now()
    getSystem(controller.signal)
      .then((data) => {
        if (active) {
          setSystem({
            status: 'ready',
            data,
            elapsedMs: performance.now() - started,
            checkedAt: new Date(),
          })
        }
      })
      .catch((error: unknown) => {
        if (active) setSystem({ status: 'error', message: errorMessage(error) })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [reload])

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = window.setTimeout(() => setCopyState('idle'), 2400)
    return () => window.clearTimeout(timer)
  }, [copyState])

  // The preview and the request share this object, so they cannot drift apart.
  const configuration = {
    label,
    timeoutSeconds: Number(timeout),
    memoryMiB: Number(memory),
  }

  function clearFeedback() {
    setOutcome(null)
    setFailure(null)
  }

  function refreshSystem() {
    setSystem({ status: 'loading' })
    setReload((value) => value + 1)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearFeedback()
    setBusy(true)
    try {
      setOutcome(await checkPreflight(configuration))
    } catch (error: unknown) {
      setFailure({
        message: errorMessage(error),
        status: error instanceof ApiError ? error.status : null,
        fields: error instanceof ApiError ? error.fields : {},
      })
    } finally {
      setBusy(false)
    }
  }

  async function copyInstallationId(id: string) {
    const clipboard: Clipboard | undefined = navigator.clipboard
    try {
      if (!clipboard) throw new Error('Clipboard unavailable')
      await clipboard.writeText(id)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  const ready = system.status === 'ready'
  const stack =
    system.status === 'ready'
      ? {
          value: 'Connected',
          pill: 'Stack online',
          note: `${formatMs(system.elapsedMs)} round trip`,
        }
      : system.status === 'loading'
        ? {
            value: 'Checking...',
            pill: 'Checking stack',
            note: 'Requesting metadata',
          }
        : {
            value: 'Unavailable',
            pill: 'Stack offline',
            note: 'Last request failed',
          }
  const badge = busy
    ? { kind: 'busy', text: 'Sending' }
    : outcome
      ? { kind: 'ok', text: `HTTP ${outcome.status}` }
      : failure
        ? {
            kind: 'bad',
            text: failure.status === null ? 'Failed' : `HTTP ${failure.status}`,
          }
        : { kind: 'idle', text: 'Draft' }

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <header className="rail">
        <a className="brand" href="#overview" aria-label="Replicas Lab home">
          <BrandMark />
          <span className="brand-name">replicas</span>
          <span className="brand-tag">lab</span>
        </a>

        <p className="rail-caption" aria-hidden="true">
          Workspace
        </p>
        <nav className="rail-nav" aria-label="Workspace navigation">
          {sections.map((section, index) => (
            <a
              key={section.id}
              className="nav-link"
              href={`#${section.id}`}
              aria-current={
                activeSection === section.id ? 'location' : undefined
              }
            >
              <Icon name={section.icon} />
              <span>{section.label}</span>
              <span className="nav-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
            </a>
          ))}
        </nav>

        <div className="rail-tools">
          <div className="stack-pill" data-state={system.status}>
            <span className="pill-dot" aria-hidden="true" />
            <span className="pill-text">{stack.pill}</span>
            {system.status === 'ready' && (
              <span className="pill-meta">{formatMs(system.elapsedMs)}</span>
            )}
          </div>
          <div className="theme-switch" role="group" aria-label="Theme">
            <button
              type="button"
              aria-pressed={theme === 'midnight'}
              onClick={() => chooseTheme('midnight')}
            >
              <Icon name="moon" size={15} />
              <span>Midnight</span>
            </button>
            <button
              type="button"
              aria-pressed={theme === 'daylight'}
              onClick={() => chooseTheme('daylight')}
            >
              <Icon name="sun" size={15} />
              <span>Daylight</span>
            </button>
          </div>
        </div>

        <div className="rail-foot">
          <span className="avatar" aria-hidden="true">
            RL
          </span>
          <div>
            <strong>Replicas Lab</strong>
            <span>Independent prototype</span>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <div className="context-bar">
          <p className="breadcrumb">
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>Overview</strong>
          </p>
          <div className="context-chips">
            <span className="chip">
              <Icon name="lock" size={13} />
              Local environment
            </span>
            <span className="chip chip-accent">
              Phase 01 · Working skeleton
            </span>
          </div>
        </div>

        <section
          className="hero"
          id="overview"
          aria-labelledby="page-title"
          tabIndex={-1}
        >
          <div className="hero-copy">
            <p className="hero-eyebrow">
              <span aria-hidden="true" />
              Local first. Possibility next.
            </p>
            <h1 id="page-title">
              Build boldly.
              <br />
              <em>Start safely.</em>
            </h1>
            <p className="hero-lede">
              A control room for coding agents, built before the first agent
              exists. Inspect the local stack, set the limits, and validate a
              synthetic configuration.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#preflight">
                Run a preflight
                <Icon name="arrow" size={17} />
              </a>
              <a className="button button-ghost" href="#foundation">
                Inspect the stack
              </a>
            </div>
            <ul className="hero-assurances">
              <li>
                <Icon name="check" size={14} />
                Loopback only
              </li>
              <li>
                <Icon name="check" size={14} />
                Synthetic data
              </li>
              <li>
                <Icon name="check" size={14} />
                Execution disabled
              </li>
            </ul>
          </div>
          <div className="hero-art">
            <StackIllustration state={system.status} />
          </div>
        </section>

        <section className="summary" aria-label="Workspace summary">
          <Tile
            icon="terminal"
            tone="lavender"
            label="Environment"
            value="Local only"
            note="Loopback gateway"
          />
          <Tile
            icon="pulse"
            tone={system.status === 'error' ? 'coral' : 'citron'}
            label="Stack connection"
            value={stack.value}
            note={stack.note}
            state={system.status}
          />
          <Tile
            icon="database"
            tone="lavender"
            label="Schema"
            value={
              system.status === 'ready' ? `v${system.data.schemaVersion}` : '—'
            }
            note={ready ? 'Flyway managed' : 'Not verified'}
          />
          <Tile
            icon="shield"
            tone="coral"
            label="Execution"
            value="Disabled"
            note="No tasks are run"
          />
        </section>

        <section
          className="card preflight"
          id="preflight"
          aria-labelledby="preflight-heading"
          tabIndex={-1}
        >
          <div className="preflight-form">
            <div className="card-head">
              <span className="icon-tile tone-citron">
                <Icon name="sliders" />
              </span>
              <div>
                <p className="eyebrow">Validation only</p>
                <h2 id="preflight-heading">Configuration preflight</h2>
              </div>
            </div>
            <p className="card-lede">
              Set the boundaries and the API checks them against its contract.
              Use synthetic values only.
            </p>
            <form
              onSubmit={(event) => {
                void submit(event)
              }}
            >
              <fieldset disabled={busy}>
                <legend className="sr-only">Synthetic configuration</legend>
                <div className="field">
                  <div className="field-top">
                    <label htmlFor="label">Task label</label>
                    <span className="counter" aria-hidden="true">
                      {label.length} / {limits.label}
                    </span>
                  </div>
                  <div className="control">
                    <Icon name="tag" size={16} />
                    <input
                      id="label"
                      name="label"
                      value={label}
                      maxLength={limits.label}
                      required
                      autoComplete="off"
                      aria-describedby="label-help label-error"
                      aria-invalid={Boolean(failure?.fields['label'])}
                      onChange={(event) => {
                        setLabel(event.target.value)
                        clearFeedback()
                      }}
                    />
                  </div>
                  <p id="label-help" className="hint">
                    A short, non-sensitive label. Maximum 80 characters.
                  </p>
                  <p id="label-error" className="field-error">
                    {failure?.fields['label']}
                  </p>
                </div>
                <div className="field-pair">
                  <div className="field">
                    <label htmlFor="timeout">Timeout (seconds)</label>
                    <div className="control">
                      <Icon name="clock" size={16} />
                      <input
                        id="timeout"
                        name="timeoutSeconds"
                        type="number"
                        min={limits.timeout.min}
                        max={limits.timeout.max}
                        step={1}
                        value={timeout}
                        required
                        aria-describedby="timeout-help timeout-error"
                        aria-invalid={Boolean(
                          failure?.fields['timeoutSeconds'],
                        )}
                        onChange={(event) => {
                          setTimeoutValue(event.target.value)
                          clearFeedback()
                        }}
                      />
                      <span className="unit" aria-hidden="true">
                        sec
                      </span>
                    </div>
                    <RangeMeter
                      value={configuration.timeoutSeconds}
                      min={limits.timeout.min}
                      max={limits.timeout.max}
                    />
                    <p id="timeout-help" className="hint">
                      Between 1 and 900 seconds
                    </p>
                    <p id="timeout-error" className="field-error">
                      {failure?.fields['timeoutSeconds']}
                    </p>
                  </div>
                  <div className="field">
                    <label htmlFor="memory">Memory (MiB)</label>
                    <div className="control">
                      <Icon name="chip" size={16} />
                      <input
                        id="memory"
                        name="memoryMiB"
                        type="number"
                        min={limits.memory.min}
                        max={limits.memory.max}
                        step={1}
                        value={memory}
                        required
                        aria-describedby="memory-help memory-error"
                        aria-invalid={Boolean(failure?.fields['memoryMiB'])}
                        onChange={(event) => {
                          setMemory(event.target.value)
                          clearFeedback()
                        }}
                      />
                      <span className="unit" aria-hidden="true">
                        MiB
                      </span>
                    </div>
                    <RangeMeter
                      value={configuration.memoryMiB}
                      min={limits.memory.min}
                      max={limits.memory.max}
                    />
                    <p id="memory-help" className="hint">
                      Between 128 and 2048 MiB
                    </p>
                    <p id="memory-error" className="field-error">
                      {failure?.fields['memoryMiB']}
                    </p>
                  </div>
                </div>
                <button className="button button-submit" type="submit">
                  <Icon name={busy ? 'refresh' : 'spark'} size={16} />
                  {busy ? 'Checking configuration...' : 'Check configuration'}
                  <Icon name="arrow" size={16} />
                </button>
              </fieldset>
            </form>
            <p className="safety">
              <Icon name="shield" size={14} />
              <span>
                No code is executed, no task is queued, and no external service
                is called.
              </span>
            </p>
            {failure && (
              <div className="notice notice-error" role="alert">
                <Icon name="alert" size={17} />
                <span>{failure.message}</span>
              </div>
            )}
            {outcome && (
              <div className="notice notice-success" role="status">
                <Icon name="check" size={17} />
                <div>
                  <strong>Configuration valid.</strong>
                  <p>
                    No task was queued or executed. Execution is not implemented
                    in Phase 1.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div
            className="console"
            role="group"
            aria-label="Request and response preview"
          >
            <div className="console-bar">
              <span className="console-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="console-route">
                <b>POST</b>
                /api/v1/preflight
              </span>
              <span className="console-badge" data-kind={badge.kind}>
                {badge.text}
              </span>
            </div>
            <div className="console-body">
              <p className="console-label">Request body</p>
              <JsonBlock value={configuration} />
              <p className="console-label">Response</p>
              {busy ? (
                <p className="console-note">Waiting for the API...</p>
              ) : outcome ? (
                <JsonBlock value={outcome.data} />
              ) : failure ? (
                <>
                  <p className="console-note console-error">
                    {failure.message}
                  </p>
                  {Object.keys(failure.fields).length > 0 && (
                    <JsonBlock value={failure.fields} />
                  )}
                </>
              ) : (
                <p className="console-note">
                  Nothing has been sent. The body above is exactly what will be
                  posted.
                </p>
              )}
              <div className="console-contract">
                <p className="console-label">Contract</p>
                <dl className="contract">
                  <div>
                    <dt>label</dt>
                    <dd>1 to 80 characters, not blank</dd>
                  </div>
                  <div>
                    <dt>timeoutSeconds</dt>
                    <dd>integer, 1 to 900</dd>
                  </div>
                  <div>
                    <dt>memoryMiB</dt>
                    <dd>integer, 128 to 2048</dd>
                  </div>
                  <div>
                    <dt>other fields</dt>
                    <dd>rejected</dd>
                  </div>
                </dl>
              </div>
            </div>
            <p className="console-foot">
              <Icon name="lock" size={13} />
              Not stored. Not executed.
            </p>
          </div>
        </section>

        <section
          className="card system"
          id="foundation"
          aria-labelledby="system-heading"
          tabIndex={-1}
        >
          <div className="system-head">
            <div className="card-head">
              <span className="icon-tile tone-lavender">
                <Icon name="layers" />
              </span>
              <div>
                <p className="eyebrow">From your API</p>
                <h2 id="system-heading">Foundation status</h2>
              </div>
            </div>
            {system.status === 'ready' && (
              <button
                className="button button-quiet"
                type="button"
                aria-label="Refresh system status"
                onClick={refreshSystem}
              >
                <Icon name="refresh" size={15} />
                <span aria-hidden="true">Refresh</span>
              </button>
            )}
          </div>
          <p className="card-lede">
            Real connections. Nothing simulated. One successful request proves
            every hop on the path below.
          </p>

          {system.status === 'loading' && (
            <p className="banner banner-loading" role="status">
              <span className="spinner" aria-hidden="true" />
              Connecting to the local stack...
            </p>
          )}
          {system.status === 'error' && (
            <div className="banner banner-error" role="alert">
              <Icon name="alert" size={20} />
              <div>
                <strong>System unavailable</strong>
                <p>{system.message}</p>
                <button
                  className="button button-retry"
                  type="button"
                  onClick={refreshSystem}
                >
                  <Icon name="refresh" size={15} />
                  Retry connection
                </button>
              </div>
            </div>
          )}
          {system.status === 'ready' && (
            <div className="banner banner-ok">
              <p className="banner-main" role="status">
                <span className="pulse-dot" aria-hidden="true" />
                PostgreSQL connected
              </p>
              <p className="banner-meta">
                Round trip {formatMs(system.elapsedMs)} · checked{' '}
                <time dateTime={system.checkedAt.toISOString()}>
                  {system.checkedAt.toLocaleTimeString()}
                </time>
              </p>
            </div>
          )}

          <ol className="path" data-state={system.status}>
            <PathNode icon="globe" name="Browser" note="This page" verified />
            <PathNode
              icon="gateway"
              name="Gateway"
              note="nginx on loopback"
              verified={ready}
            />
            <PathNode
              icon="server"
              name="API"
              note="Spring Boot · Java 21"
              verified={ready}
            />
            <PathNode
              icon="database"
              name="PostgreSQL"
              note={
                system.status === 'ready'
                  ? `Schema v${system.data.schemaVersion}`
                  : 'Awaiting a response'
              }
              verified={ready}
            />
          </ol>

          {system.status === 'loading' && (
            <div className="facts-skeleton" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
          {system.status === 'ready' && (
            <dl className="facts">
              <div>
                <dt>Service</dt>
                <dd className="mono">{system.data.service}</dd>
              </div>
              <div>
                <dt>Phase</dt>
                <dd className="mono">{system.data.phase}</dd>
              </div>
              <div>
                <dt>Schema version</dt>
                <dd>
                  <span className="badge">v{system.data.schemaVersion}</span>
                  Flyway managed
                </dd>
              </div>
              <div>
                <dt>Initialized</dt>
                <dd>
                  <time dateTime={system.data.createdAt}>
                    {new Date(system.data.createdAt).toLocaleString()}
                  </time>
                </dd>
              </div>
              <div className="fact-wide">
                <dt>Installation ID</dt>
                <dd className="id-row">
                  <span className="mono id-value">
                    {system.data.installationId}
                  </span>
                  <button
                    className="copy"
                    type="button"
                    aria-label="Copy installation ID"
                    onClick={() => {
                      void copyInstallationId(system.data.installationId)
                    }}
                  >
                    <Icon
                      name={copyState === 'copied' ? 'check' : 'copy'}
                      size={14}
                    />
                    <span aria-hidden="true">
                      {copyState === 'copied'
                        ? 'Copied'
                        : copyState === 'failed'
                          ? 'Not copied'
                          : 'Copy'}
                    </span>
                  </button>
                  <span className="sr-only" role="status">
                    {copyState === 'copied'
                      ? 'Installation ID copied.'
                      : copyState === 'failed'
                        ? 'Copying is not available in this browser.'
                        : ''}
                  </span>
                </dd>
              </div>
            </dl>
          )}
          <p className="system-note">
            <Icon name="shield" size={14} />
            <span>
              The installation identity persists across restarts. Workers are
              not implemented in Phase 1.
            </span>
          </p>
        </section>

        <section
          className="roadmap"
          id="roadmap"
          aria-labelledby="next-heading"
          tabIndex={-1}
        >
          <div className="section-head">
            <div>
              <p className="eyebrow">A foundation, not a finish line</p>
              <h2 id="next-heading">A little further down the road.</h2>
            </div>
            <span className="chip">02 onward: planned, not implemented</span>
          </div>
          <ol className="timeline">
            <li className="stop stop-now">
              <span className="stop-node" aria-hidden="true" />
              <div className="stop-card">
                <p className="stop-phase">01 · You are here</p>
                <h3>Working skeleton</h3>
                <p>
                  API, dashboard, migrations, health checks, and a non-executing
                  preflight.
                </p>
              </div>
            </li>
            <li className="stop">
              <span className="stop-node" aria-hidden="true" />
              <div className="stop-card">
                <p className="stop-phase">02 · Next</p>
                <h3>Task contracts</h3>
                <p>Identity, state transitions, and retry-safe idempotency.</p>
              </div>
            </li>
            <li className="stop">
              <span className="stop-node" aria-hidden="true" />
              <div className="stop-card">
                <p className="stop-phase">03 · Later</p>
                <h3>Bounded workers</h3>
                <p>Leases, checkpoints, budgets, and verifiable evidence.</p>
              </div>
            </li>
            <li className="stop">
              <span className="stop-node" aria-hidden="true" />
              <div className="stop-card">
                <p className="stop-phase">04+ · Later</p>
                <h3>Agents &amp; evaluation</h3>
                <p>Explicit adapters. Measured reliability. No shortcuts.</p>
              </div>
            </li>
          </ol>
        </section>

        <footer className="page-foot">
          <p className="boundary">
            <Icon name="shield" size={16} />
            <span>
              <strong>A lab, not a production boundary.</strong> Docker alone is
              not a hardened boundary for untrusted code.
            </span>
          </p>
          <p className="colophon">
            Independent prototype. Not affiliated with Replicas.
          </p>
        </footer>
      </main>
    </div>
  )
}

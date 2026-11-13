import type { CSSProperties } from 'react'
import { Icon, type IconName } from './Icon'
import {
  formatMs,
  type CopyState,
  type Sample,
  type SystemState,
} from './model'
import { useReveal } from './motion'
import { Decode, Heading, Odometer } from './ui'

type Props = {
  system: SystemState
  history: readonly Sample[]
  copyState: CopyState
  onRefresh: () => void
  onCopy: (id: string) => void
}

// Every check made during this visit, drawn to scale against the slowest.
function Trace({ history }: { history: readonly Sample[] }) {
  const timings = history.flatMap((sample) =>
    'ms' in sample ? [sample.ms] : [],
  )
  const slowest = Math.max(...timings, 1)
  const failed = history.length - timings.length
  const summary = [
    `${history.length} ${history.length === 1 ? 'check' : 'checks'} this visit`,
    timings.length > 1 ? `fastest ${formatMs(Math.min(...timings))}` : '',
    failed > 0 ? `${failed} failed` : '',
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="trace">
      <ol className="trace-bars" aria-label="Checks measured this visit">
        {history.map((sample, index) =>
          'ms' in sample ? (
            <li
              key={index}
              style={
                {
                  '--h': `${Math.max(6, (sample.ms / slowest) * 100).toFixed(1)}%`,
                } as CSSProperties
              }
            >
              <span className="sr-only">{formatMs(sample.ms)}</span>
            </li>
          ) : (
            <li key={index} data-failed="">
              <span className="sr-only">Failed check</span>
            </li>
          ),
        )}
      </ol>
      <p className="trace-caption">{summary}</p>
    </div>
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
        <Icon name={icon} size={26} />
        <span className="path-mark">
          <Icon name={verified ? 'check' : 'minus'} size={12} />
          <span className="sr-only">
            {verified ? 'Verified' : 'Not verified'}
          </span>
        </span>
      </span>
      <span className="path-text">
        <strong>{name}</strong>
        <span>{note}</span>
      </span>
    </li>
  )
}

export function SystemSection({
  system,
  history,
  copyState,
  onRefresh,
  onCopy,
}: Props) {
  const reveal = useReveal()
  const ready = system.status === 'ready'

  return (
    <section
      className="section tone-base system"
      id="foundation"
      aria-labelledby="system-heading"
      tabIndex={-1}
    >
      <div className="section-head" ref={reveal} data-reveal>
        <span className="numeral" aria-hidden="true">
          02
        </span>
        <div className="section-title">
          <p className="eyebrow">
            <Decode text="Instrument 02 · From your API" />
          </p>
          <Heading id="system-heading" text="Foundation status" />
        </div>
        <p className="section-lede">
          Real connections. Nothing simulated. One successful request proves
          every hop on the path below.
        </p>
      </div>

      <div
        className="signal"
        ref={reveal}
        data-reveal
        data-state={system.status}
      >
        <div className="readout">
          <p className="readout-figure">
            <span className="readout-value">
              {system.status === 'ready' ? (
                <Odometer value={Math.max(1, Math.round(system.elapsedMs))} />
              ) : (
                '—'
              )}
            </span>
            <span className="readout-unit">ms</span>
          </p>
          <p className="readout-caption">
            Round trip of the last metadata request, measured in this browser.
          </p>
          {history.length > 0 && <Trace history={history} />}
        </div>

        <div className="signal-status">
          {system.status === 'loading' && (
            <p className="state state-loading" role="status">
              <span className="spinner" aria-hidden="true" />
              Connecting to the local stack...
            </p>
          )}
          {system.status === 'error' && (
            <div className="state state-error" role="alert">
              <Icon name="alert" size={22} />
              <div>
                <strong>System unavailable</strong>
                <p>{system.message}</p>
                <button
                  className="button button-retry"
                  type="button"
                  onClick={onRefresh}
                >
                  <Icon name="refresh" size={16} />
                  Retry connection
                </button>
              </div>
            </div>
          )}
          {system.status === 'ready' && (
            <div className="state state-ok">
              <p className="state-main" role="status">
                <span className="pulse-dot" aria-hidden="true" />
                PostgreSQL connected
              </p>
              <p className="state-meta">
                Checked{' '}
                <time dateTime={system.checkedAt.toISOString()}>
                  {system.checkedAt.toLocaleTimeString()}
                </time>
              </p>
              <button
                className="button button-refresh"
                type="button"
                aria-label="Refresh system status"
                data-cursor="label"
                data-cursor-label="Sync"
                onClick={onRefresh}
              >
                <Icon name="refresh" size={16} />
                <span aria-hidden="true">Refresh</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ol className="path" data-state={system.status} ref={reveal} data-reveal>
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
        <dl className="facts" ref={reveal} data-reveal>
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
                className="button"
                type="button"
                aria-label="Copy installation ID"
                data-cursor="label"
                data-cursor-label="Copy"
                onClick={() => onCopy(system.data.installationId)}
              >
                <Icon
                  name={copyState === 'copied' ? 'check' : 'copy'}
                  size={15}
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
        <Icon name="shield" size={15} />
        <span>
          The installation identity persists across restarts. Workers are not
          implemented in Phase 1.
        </span>
      </p>
    </section>
  )
}

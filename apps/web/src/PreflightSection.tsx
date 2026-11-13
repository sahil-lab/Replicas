import { Fragment, useRef, type CSSProperties, type FormEvent } from 'react'
import type { PreflightOutcome, PreflightRequest } from './api'
import { Icon } from './Icon'
import { limits, stackShape, type PreflightFailure } from './model'
import { useReveal } from './motion'
import { StackPreview } from './StackPreview'
import { useTilt } from './tilt'
import { Decode, Heading, RingText } from './ui'

type Props = {
  label: string
  timeout: string
  memory: string
  busy: boolean
  configuration: PreflightRequest
  outcome: PreflightOutcome | null
  failure: PreflightFailure | null
  onLabel: (value: string) => void
  onTimeout: (value: string) => void
  onMemory: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
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

// A slider mirrors the numeric field; out-of-range typing parks it at an end.
function sliderPosition(value: number, min: number, max: number) {
  const bounded = Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : min
  return {
    value: bounded,
    fill: `${(((bounded - min) / (max - min)) * 100).toFixed(2)}%`,
  }
}

export function PreflightSection({
  label,
  timeout,
  memory,
  busy,
  configuration,
  outcome,
  failure,
  onLabel,
  onTimeout,
  onMemory,
  onSubmit,
}: Props) {
  const reveal = useReveal()
  const consoleRef = useRef<HTMLDivElement>(null)
  useTilt(consoleRef)
  const timeoutSlider = sliderPosition(
    configuration.timeoutSeconds,
    limits.timeout.min,
    limits.timeout.max,
  )
  const memorySlider = sliderPosition(
    configuration.memoryMiB,
    limits.memory.min,
    limits.memory.max,
  )
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
  const seal = outcome
    ? 'Valid • Not executed • Valid • Not executed • '
    : 'Not accepted • Nothing ran • Not accepted • '
  const shape = stackShape(
    configuration.timeoutSeconds,
    configuration.memoryMiB,
  )
  const result = busy ? 'busy' : outcome ? 'ok' : failure ? 'bad' : 'idle'
  const measure = (value: number, unit: string) =>
    Number.isFinite(value) ? `${value} ${unit}` : '—'

  return (
    <section
      className="section tone-citron preflight"
      id="preflight"
      aria-labelledby="preflight-heading"
      tabIndex={-1}
    >
      <div className="section-head" ref={reveal} data-reveal>
        <span className="numeral" aria-hidden="true">
          01
        </span>
        <div className="section-title">
          <p className="eyebrow">
            <Decode text="Instrument 01 · Validation only" />
          </p>
          <Heading id="preflight-heading" text="Configuration preflight" />
        </div>
        <p className="section-lede">
          Set the boundaries and the API checks them against its contract. Use
          synthetic values only.
        </p>
      </div>

      <div className="preflight-grid">
        <div className="instrument" ref={reveal} data-reveal>
          <form onSubmit={onSubmit}>
            <fieldset disabled={busy}>
              <legend className="sr-only">Synthetic configuration</legend>

              <div className="field">
                <div className="field-top">
                  <label htmlFor="label">Task label</label>
                  <span className="counter" aria-hidden="true">
                    {label.length} / {limits.label}
                  </span>
                </div>
                <div className="control" data-cursor="hide">
                  <input
                    id="label"
                    name="label"
                    value={label}
                    maxLength={limits.label}
                    required
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="label-help label-error"
                    aria-invalid={Boolean(failure?.fields['label'])}
                    onChange={(event) => onLabel(event.target.value)}
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
                  <div className="control control-number" data-cursor="hide">
                    <input
                      id="timeout"
                      name="timeoutSeconds"
                      type="number"
                      inputMode="numeric"
                      min={limits.timeout.min}
                      max={limits.timeout.max}
                      step={1}
                      value={timeout}
                      required
                      aria-describedby="timeout-help timeout-error"
                      aria-invalid={Boolean(failure?.fields['timeoutSeconds'])}
                      onChange={(event) => onTimeout(event.target.value)}
                    />
                    <span className="unit" aria-hidden="true">
                      sec
                    </span>
                  </div>
                  <input
                    className="slider"
                    type="range"
                    aria-label="Adjust timeout"
                    min={limits.timeout.min}
                    max={limits.timeout.max}
                    step={1}
                    value={timeoutSlider.value}
                    style={{ '--fill': timeoutSlider.fill } as CSSProperties}
                    data-cursor="hide"
                    onChange={(event) => onTimeout(event.target.value)}
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
                  <div className="control control-number" data-cursor="hide">
                    <input
                      id="memory"
                      name="memoryMiB"
                      type="number"
                      inputMode="numeric"
                      min={limits.memory.min}
                      max={limits.memory.max}
                      step={1}
                      value={memory}
                      required
                      aria-describedby="memory-help memory-error"
                      aria-invalid={Boolean(failure?.fields['memoryMiB'])}
                      onChange={(event) => onMemory(event.target.value)}
                    />
                    <span className="unit" aria-hidden="true">
                      MiB
                    </span>
                  </div>
                  <input
                    className="slider"
                    type="range"
                    aria-label="Adjust memory"
                    min={limits.memory.min}
                    max={limits.memory.max}
                    step={1}
                    value={memorySlider.value}
                    style={{ '--fill': memorySlider.fill } as CSSProperties}
                    data-cursor="hide"
                    onChange={(event) => onMemory(event.target.value)}
                  />
                  <p id="memory-help" className="hint">
                    Between 128 and 2048 MiB
                  </p>
                  <p id="memory-error" className="field-error">
                    {failure?.fields['memoryMiB']}
                  </p>
                </div>
              </div>

              <button
                className="submit"
                type="submit"
                data-cursor="label"
                data-cursor-label="Send"
              >
                <span className="submit-text">
                  {busy ? 'Checking configuration...' : 'Check configuration'}
                </span>
                <span className="submit-orb" aria-hidden="true">
                  <Icon name={busy ? 'refresh' : 'arrow'} size={22} />
                </span>
              </button>
            </fieldset>
          </form>

          <p className="safety">
            <Icon name="shield" size={15} />
            <span>
              No code is executed, no task is queued, and no external service is
              called.
            </span>
          </p>

          {failure && (
            <div className="notice notice-error" role="alert">
              <Icon name="alert" size={18} />
              <span>{failure.message}</span>
            </div>
          )}
          {outcome && (
            <div className="notice notice-success" role="status">
              <Icon name="check" size={18} />
              <div>
                <strong>Configuration valid.</strong>
                <p>
                  No task was queued or executed. Execution is not implemented
                  in Phase 1.
                </p>
              </div>
            </div>
          )}

          <div className="rules">
            <p className="rules-title">Contract</p>
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

        <div className="console-wrap" ref={reveal} data-reveal>
          <div
            className="console"
            role="group"
            aria-label="Request and response preview"
            ref={consoleRef}
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
            <div className="viewport" data-result={result}>
              <div className="viewport-frame">
                <StackPreview
                  count={shape.count}
                  width={shape.width}
                  result={result}
                />
                <div
                  className="ruler ruler-y"
                  aria-hidden="true"
                  style={
                    {
                      '--fill': `${(shape.time * 100).toFixed(2)}%`,
                    } as CSSProperties
                  }
                >
                  <span className="ruler-name">Timeout</span>
                  <span className="ruler-value">
                    {measure(configuration.timeoutSeconds, 's')}
                  </span>
                  <span className="ruler-track">
                    <i />
                  </span>
                </div>
                <div
                  className="ruler ruler-x"
                  aria-hidden="true"
                  style={
                    {
                      '--fill': `${(shape.memory * 100).toFixed(2)}%`,
                    } as CSSProperties
                  }
                >
                  <span className="ruler-track">
                    <i />
                  </span>
                  <span className="ruler-name">Memory</span>
                  <span className="ruler-value">
                    {measure(configuration.memoryMiB, 'MiB')}
                  </span>
                </div>
              </div>
              <p className="viewport-note">
                Drawn from the limits you set. Nothing is running.
              </p>
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
            </div>
            <p className="console-foot">
              <Icon name="lock" size={13} />
              Not stored. Not executed.
            </p>
            <i className="console-glare" data-glare="" aria-hidden="true" />
          </div>
          {(outcome || failure) && (
            <span
              className="seal"
              data-kind={outcome ? 'ok' : 'bad'}
              aria-hidden="true"
            >
              <RingText id="seal-ring" text={seal} />
              <Icon name={outcome ? 'check' : 'alert'} size={26} />
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

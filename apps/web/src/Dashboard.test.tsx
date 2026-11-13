import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'
import { MotionContext } from './motion'
import { Odometer } from './ui'

afterEach(() => {
  window.localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.motion
  Reflect.deleteProperty(navigator, 'clipboard')
})

const system = {
  service: 'replicas-orchestrator',
  phase: 'phase-1',
  database: 'up',
  installationId: '05f22106-53a6-4794-bb1e-aef87b16bc55',
  createdAt: '2026-11-11T10:00:00Z',
  schemaVersion: 1,
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('dashboard', () => {
  it('renders real system metadata after an explicit loading state', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(system))
    render(<Dashboard />)
    expect(
      screen.getByText('Connecting to the local stack...'),
    ).toBeInTheDocument()
    expect(await screen.findByText('PostgreSQL connected')).toBeInTheDocument()
    expect(screen.getByText(system.installationId)).toBeInTheDocument()
    expect(screen.getByText(/No code is executed/)).toBeInTheDocument()
    // Headings and labels are split up for animation; their names must not be.
    expect(screen.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Build boldly. Start safely.',
    )
    for (const name of [
      'Configuration preflight',
      'Foundation status',
      'A little further down the road.',
    ]) {
      expect(
        screen.getByRole('heading', { level: 2, name }),
      ).toBeInTheDocument()
    }
    expect(
      screen.getByText('Instrument 01 · Validation only', {
        selector: '.sr-only',
      }),
    ).toBeInTheDocument()
  })

  it('shows database failure and retries instead of displaying mock health', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ detail: 'Database unavailable.' }, 503))
      .mockResolvedValueOnce(json(system))
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Database unavailable.',
    )
    expect(screen.queryByText('PostgreSQL connected')).not.toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: 'Retry connection' }),
    )
    expect(await screen.findByText('PostgreSQL connected')).toBeInTheDocument()
  })

  it('refreshes connection status without retaining stale success on failure', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(json({ detail: 'Database unavailable.' }, 503))
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    const checks = screen.getByRole('list', {
      name: 'Checks measured this visit',
    })
    expect(checks.children).toHaveLength(1)
    await userEvent.click(
      screen.getByRole('button', { name: 'Refresh system status' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Database unavailable.',
    )
    expect(screen.queryByText('PostgreSQL connected')).not.toBeInTheDocument()
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
    // The failed check joins the measured one; neither is invented.
    expect(checks.children).toHaveLength(2)
    expect(checks.lastElementChild).toHaveTextContent('Failed check')
    expect(
      screen.getByText('2 checks this visit · 1 failed'),
    ).toBeInTheDocument()
  })

  it('rejects a success-shaped response that violates the contract', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      json({ ...system, database: 'mock' }),
    )
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'did not match the API contract',
    )
    expect(screen.queryByText('PostgreSQL connected')).not.toBeInTheDocument()
  })

  it('reports a network failure explicitly', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(
      new TypeError('fetch failed'),
    )
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Cannot reach the API',
    )
  })

  it('submits numeric limits and clearly reports that execution is disabled', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(
        json({
          valid: true,
          executionEnabled: false,
          label: 'synthetic-demo',
        }),
      )
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    await userEvent.click(
      screen.getByRole('button', { name: 'Check configuration' }),
    )
    expect(await screen.findByText('Configuration valid.')).toBeInTheDocument()
    expect(
      screen.getByText(/No task was queued or executed/),
    ).toBeInTheDocument()
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/v1/preflight',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          label: 'synthetic-demo',
          timeoutSeconds: 300,
          memoryMiB: 512,
        }),
      }),
    )
    await userEvent.type(screen.getByLabelText('Task label'), '-edited')
    expect(screen.queryByText('Configuration valid.')).not.toBeInTheDocument()
  })

  it('renders server-side field validation without a success message', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(
        json(
          {
            detail: 'Request validation failed.',
            errors: { timeoutSeconds: 'must be less than or equal to 900' },
          },
          400,
        ),
      )
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    await userEvent.click(
      screen.getByRole('button', { name: 'Check configuration' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Request validation failed.',
    )
    expect(screen.getByLabelText('Timeout (seconds)')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(screen.queryByText('Configuration valid.')).not.toBeInTheDocument()
  })

  it('does not accept an unexpected task execution response', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(
        json({
          valid: true,
          executionEnabled: true,
          label: 'synthetic-demo',
        }),
      )
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    await userEvent.click(
      screen.getByRole('button', { name: 'Check configuration' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'did not match the API contract',
    )
    expect(screen.queryByText('Configuration valid.')).not.toBeInTheDocument()
  })

  it('previews the exact request body and shows the real response', async () => {
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(
        json({
          valid: true,
          executionEnabled: false,
          label: 'synthetic-demo',
        }),
      )
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    const preview = screen.getByRole('group', {
      name: 'Request and response preview',
    })
    expect(preview).toHaveTextContent('"timeoutSeconds": 300')
    expect(preview).toHaveTextContent('Draft')

    const timeout = screen.getByLabelText('Timeout (seconds)')
    await userEvent.clear(timeout)
    await userEvent.type(timeout, '120')
    expect(preview).toHaveTextContent('"timeoutSeconds": 120')

    await userEvent.click(
      screen.getByRole('button', { name: 'Check configuration' }),
    )
    await screen.findByText('Configuration valid.')
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/v1/preflight',
      expect.objectContaining({
        body: JSON.stringify({
          label: 'synthetic-demo',
          timeoutSeconds: 120,
          memoryMiB: 512,
        }),
      }),
    )
    expect(preview).toHaveTextContent('HTTP 200')
    expect(preview).toHaveTextContent('"executionEnabled": false')
  })

  it('shows the rejected status and field errors in the preview', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(
        json(
          {
            detail: 'Request validation failed.',
            errors: { memoryMiB: 'must be greater than or equal to 128' },
          },
          400,
        ),
      )
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    await userEvent.click(
      screen.getByRole('button', { name: 'Check configuration' }),
    )
    await screen.findByRole('alert')
    const preview = screen.getByRole('group', {
      name: 'Request and response preview',
    })
    expect(preview).toHaveTextContent('HTTP 400')
    expect(preview).toHaveTextContent(
      '"memoryMiB": "must be greater than or equal to 128"',
    )
  })

  it('switches theme and remembers the choice', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(json(system)),
    )
    const first = render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    expect(document.documentElement.dataset.theme).toBe('midnight')
    expect(screen.getByRole('button', { name: 'Midnight' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Daylight' }))
    expect(document.documentElement.dataset.theme).toBe('daylight')
    expect(window.localStorage.getItem('replicas.theme')).toBe('daylight')

    first.unmount()
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    expect(screen.getByRole('button', { name: 'Daylight' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(document.documentElement.dataset.theme).toBe('daylight')
  })

  it('copies the installation identity when the clipboard is available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(system))
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy installation ID' }),
    )
    expect(
      await screen.findByText('Installation ID copied.'),
    ).toBeInTheDocument()
    expect(writeText).toHaveBeenCalledWith(system.installationId)
  })

  it('reports when copying is not available instead of claiming success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(system))
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    fireEvent.click(
      screen.getByRole('button', { name: 'Copy installation ID' }),
    )
    expect(
      await screen.findByText('Copying is not available in this browser.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByText('Installation ID copied.'),
    ).not.toBeInTheDocument()
  })

  it('keeps the slider, the numeric field and the request preview in step', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(system))
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    const slider = screen.getByRole('slider', { name: 'Adjust timeout' })
    const field = screen.getByLabelText('Timeout (seconds)')
    const preview = screen.getByRole('group', {
      name: 'Request and response preview',
    })
    expect(slider).toHaveValue('300')

    fireEvent.change(slider, { target: { value: '45' } })
    expect(field).toHaveValue(45)
    expect(preview).toHaveTextContent('"timeoutSeconds": 45')

    // A typed value outside the range is still sent as typed; only the
    // slider parks at its end, so the API remains the judge of validity.
    await userEvent.clear(field)
    await userEvent.type(field, '5000')
    expect(slider).toHaveValue('900')
    expect(preview).toHaveTextContent('"timeoutSeconds": 5000')
  })

  it('leaves animation off without a motion preference and remembers a change', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(system))
    render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    const toggle = screen.getByRole('button', { name: 'Animations' })
    expect(document.documentElement.dataset.motion).toBe('off')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(toggle)
    expect(document.documentElement.dataset.motion).toBe('on')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('replicas.motion')).toBe('on')
    expect(screen.getByText('PostgreSQL connected')).toBeInTheDocument()
  })

  it('rolls the latency as digits and keeps the plain number for readers', () => {
    const { container } = render(
      <MotionContext value="on">
        <Odometer value={166} />
      </MotionContext>,
    )
    // Assistive technology gets the number; the rolling digits are decoration.
    expect(screen.getByText('166')).toHaveClass('sr-only')
    expect(container.querySelector('.odometer-digits')).toHaveAttribute(
      'aria-hidden',
      'true',
    )
    // One column per digit, each headed for its own digit a full turn round.
    const columns = container.querySelectorAll<HTMLElement>('.odometer-column')
    expect(
      Array.from(columns, (column) => column.style.getPropertyValue('--d')),
    ).toEqual(['11', '16', '16'])
  })

  it('shows the latency as a plain number when animation is off', () => {
    const { container } = render(<Odometer value={166} />)
    expect(screen.getByText('166')).toBeInTheDocument()
    expect(container.querySelector('.odometer-column')).toBeNull()
  })

  it('shows the flat schematic when WebGL is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json(system))
    const { container } = render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    expect(container.querySelector('.hero-stage')).toHaveAttribute(
      'data-gl',
      'fallback',
    )
    expect(
      container.querySelectorAll('.hero-stage .schematic-plate'),
    ).toHaveLength(21)
  })

  it('draws the preview from the limits and leaves validity to the API', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json(system))
      .mockResolvedValueOnce(
        json({ detail: 'Request validation failed.' }, 400),
      )
    const { container } = render(<Dashboard />)
    await screen.findByText('PostgreSQL connected')
    const plates = () =>
      container.querySelectorAll('.preview-stage .schematic-plate').length
    const slider = screen.getByRole('slider', { name: 'Adjust timeout' })
    const drawing = container.querySelector('.preview-stage .schematic')
    expect(plates()).toBe(11)

    fireEvent.change(slider, { target: { value: '900' } })
    expect(plates()).toBe(21)
    fireEvent.change(slider, { target: { value: '1' } })
    expect(plates()).toBe(6)

    // Beyond the contract the drawing parks at its largest and stays neutral:
    // only the API's answer changes how it is drawn.
    const field = screen.getByLabelText('Timeout (seconds)')
    await userEvent.clear(field)
    await userEvent.type(field, '5000')
    expect(plates()).toBe(21)
    expect(drawing).toHaveAttribute('data-state', 'ready')

    await userEvent.clear(field)
    await userEvent.type(field, '900')
    await userEvent.click(
      screen.getByRole('button', { name: 'Check configuration' }),
    )
    await screen.findByRole('alert')
    expect(drawing).toHaveAttribute('data-state', 'error')
  })
})

import { test, expect } from '@playwright/test'

test('dashboard uses the real API and validates without executing a task', async ({
  page,
  request,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page).toHaveTitle('Replicas Lab | Orchestrator')
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
  await page.getByLabel('Task label').fill('browser-smoke')
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/v1/preflight') &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Check configuration' }).click()
  const response = await responsePromise
  expect(response.status()).toBe(200)
  const body: unknown = await response.json()
  expect(body).toStrictEqual({
    valid: true,
    executionEnabled: false,
    label: 'browser-smoke',
  })
  await expect(page.getByText('Configuration valid.')).toBeVisible()
  await expect(page.getByText(/No task was queued or executed/)).toBeVisible()

  // Self-hosted fonts must load under the gateway's content-security policy.
  const loadedFamilies = await page.evaluate(async () => {
    await document.fonts.ready
    const families: string[] = []
    document.fonts.forEach((face) => {
      if (face.status === 'loaded') {
        families.push(face.family.replace(/["']/g, ''))
      }
    })
    return families
  })
  for (const family of [
    'Fraunces Variable',
    'Geist Variable',
    'Geist Mono Variable',
  ]) {
    expect(loadedFamilies).toContain(family)
  }
  expect(errors).toEqual([])

  const metadata = await request.get('/api/v1/system')
  expect(metadata.status()).toBe(200)
  expect(metadata.headers()['x-request-id']).toMatch(/^[0-9a-f-]{36}$/)
  const system: unknown = await metadata.json()
  expect(system).toStrictEqual({
    service: 'replicas-orchestrator',
    phase: 'phase-1',
    database: 'up',
    installationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.+Z$/),
    schemaVersion: 1,
  })
})

test('health and validation expose their documented HTTP contracts', async ({
  request,
}) => {
  for (const path of [
    '/actuator/health/liveness',
    '/actuator/health/readiness',
  ]) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    expect(await response.json()).toStrictEqual({ status: 'UP' })
  }
  for (const data of [
    { label: '', timeoutSeconds: 300, memoryMiB: 512 },
    { label: 'x', timeoutSeconds: 0, memoryMiB: 512 },
    { label: 'x', timeoutSeconds: 901, memoryMiB: 512 },
    { label: 'x', timeoutSeconds: 300, memoryMiB: 127 },
    { label: 'x', timeoutSeconds: 300, memoryMiB: 2049 },
    { label: 'x', timeoutSeconds: '300', memoryMiB: 512 },
    { label: 12, timeoutSeconds: 300, memoryMiB: 512 },
    { label: 'x', timeoutSeconds: 300, memoryMiB: 512, extra: true },
  ]) {
    const response = await request.post('/api/v1/preflight', { data })
    expect(response.status()).toBe(400)
    expect(response.headers()['content-type']).toContain(
      'application/problem+json',
    )
    expect(await response.json()).toMatchObject({
      status: 400,
      title: 'Invalid request',
    })
  }
  const tooLarge = await request.post('/api/v1/preflight', {
    data: { label: 'x'.repeat(10_000), timeoutSeconds: 300, memoryMiB: 512 },
  })
  expect(tooLarge.status()).toBe(413)
  expect(tooLarge.headers()['content-type']).toContain(
    'application/problem+json',
  )
})

for (const width of [1440, 1024, 768, 375, 320]) {
  test(`workspace navigation and preflight fit a ${width}px viewport`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    // A reduced-motion preference turns the animated layer off entirely.
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
    await expect(page.locator('.journey')).not.toHaveAttribute(
      'data-journey',
      '',
    )
    await expect(page.getByText('PostgreSQL connected')).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Preflight', exact: true })
      .click()
    await expect(page).toHaveURL(/#preflight$/)
    await expect(
      page.getByRole('heading', { name: 'Configuration preflight' }),
    ).toBeInViewport()
    // The sticky navigation must not cover the section it scrolled to.
    expect(
      await page
        .getByRole('heading', { name: 'Configuration preflight' })
        .evaluate((heading) => {
          const box = heading.getBoundingClientRect()
          const topmost = document.elementFromPoint(
            box.left + box.width / 2,
            box.top + box.height / 2,
          )
          return topmost !== null && heading.contains(topmost)
        }),
    ).toBe(true)
    await page.getByLabel('Task label').fill(`responsive-${width}`)
    await page.getByRole('button', { name: 'Check configuration' }).click()
    await expect(page.getByText('Configuration valid.')).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true)
    const form = await page
      .getByRole('region', { name: 'Configuration preflight' })
      .boundingBox()
    expect(form).not.toBeNull()
    expect(form!.x).toBeGreaterThanOrEqual(0)
    expect(form!.x + form!.width).toBeLessThanOrEqual(width)
  })
}

test('the theme choice applies and survives a reload', async ({ page }) => {
  // Animation is on here, and CI draws it on a CPU renderer.
  test.slow()
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'midnight')
  await page.getByRole('button', { name: 'Daylight' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'daylight')
  await expect(page.getByRole('button', { name: 'Daylight' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
})

test('the boot sequence clears itself and animation can be paused for good', async ({
  page,
}) => {
  test.slow()
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'on')
  // The boot overlay has to get out of the way without any interaction.
  await expect(page.locator('.preloader')).toHaveCount(0)
  await expect(page.locator('.app')).toHaveAttribute('data-loaded', 'true')
  // The sculpture settles on real WebGL output or its flat fallback.
  await expect(page.locator('.hero-stage')).not.toHaveAttribute(
    'data-gl',
    'pending',
  )

  await page.getByRole('button', { name: 'Animations' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off')
  await expect(page.locator('.preloader')).toHaveCount(0)
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
})

test('scrolling covers the pinned hero and lights the premise', async ({
  page,
}) => {
  test.slow()
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  const hero = page.locator('.hero-pin')
  await expect(hero).not.toHaveAttribute('data-covered', '')
  await expect(page.locator('.premise .w[data-lit]')).toHaveCount(0)

  await page
    .getByRole('heading', { name: 'Configuration preflight' })
    .scrollIntoViewIfNeeded()
  // Once the page has slid over the hero it is hidden and cannot take focus.
  await expect(hero).toHaveAttribute('data-covered', '')
  await expect(hero).toBeHidden()
  await expect(page.locator('.premise .w[data-lit]').first()).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Configuration preflight' }),
  ).toBeVisible()
})

for (const [width, height] of [
  [1440, 620],
  [375, 667],
  [320, 568],
  [740, 360],
] as const) {
  test(`the hero headline is legible and clear of its neighbours at ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
      'Build boldly. Start safely.',
    )
    const layout = await page.evaluate(() => {
      const edges = (selector: string) => {
        const box = document.querySelector(selector)!.getBoundingClientRect()
        return {
          top: box.top,
          bottom: box.bottom,
          left: box.left,
          right: box.right,
        }
      }
      return {
        fontSize: parseFloat(
          getComputedStyle(document.querySelector('.hero-title')!).fontSize,
        ),
        first: edges('.line-back'),
        second: edges('.line-front'),
        brand: edges('.hud .brand'),
        foot: edges('.hero-foot'),
        action: edges('.cta-orbit'),
        panel: edges('.hero-pin'),
      }
    })
    expect(layout.fontSize).toBeGreaterThanOrEqual(40)
    expect(layout.first.top).toBeGreaterThanOrEqual(layout.brand.bottom)
    expect(layout.second.top).toBeGreaterThanOrEqual(layout.first.bottom - 1)
    expect(layout.second.bottom).toBeLessThanOrEqual(layout.foot.top + 1)
    expect(layout.first.left).toBeGreaterThanOrEqual(0)
    expect(layout.second.right).toBeLessThanOrEqual(width)
    // The main call to action must stay inside the hero panel, in reach.
    expect(layout.action.bottom).toBeLessThanOrEqual(layout.panel.bottom)
    await expect(
      page.getByRole('link', { name: 'Run a preflight' }),
    ).toBeVisible()
  })
}

test('wheel scrolling glides to its target and keys stay native', async ({
  page,
}) => {
  test.slow()
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  const position = () => page.evaluate(() => Math.round(window.scrollY))
  await page.mouse.move(700, 450)
  await page.mouse.wheel(0, 1200)
  await expect.poll(position).toBe(1200)
  // From here on the page may only move forward: a glide must not begin by
  // stepping back.
  await page.evaluate(() => {
    const watched = window as unknown as { start: number; lowest: number }
    watched.start = window.scrollY
    watched.lowest = window.scrollY
    const watch = () => {
      watched.lowest = Math.min(watched.lowest, window.scrollY)
      requestAnimationFrame(watch)
    }
    requestAnimationFrame(watch)
  })
  // More notches during a glide extend the same target.
  await page.mouse.wheel(0, 300)
  await page.mouse.wheel(0, 300)
  await expect.poll(position).toBe(1800)
  const travel = await page.evaluate(() => {
    const watched = window as unknown as { start: number; lowest: number }
    return { start: watched.start, lowest: watched.lowest }
  })
  expect(travel.lowest).toBeGreaterThanOrEqual(travel.start)
  // Only whole notches of a wheel are taken over. A touchpad's stream of
  // small movements is left to the browser, which scrolls it off the main
  // thread.
  const taken = await page.evaluate(() => {
    const send = (init: WheelEventInit & { wheelDeltaY: number }) => {
      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        ...init,
      })
      window.dispatchEvent(event)
      return event.defaultPrevented
    }
    return {
      touchpad: send({ deltaY: 7, wheelDeltaY: -8 }),
      notch: send({ deltaY: 100, wheelDeltaY: -120 }),
    }
  })
  expect(taken).toEqual({ touchpad: false, notch: true })
  await expect.poll(position).toBe(1900)
  // Keys are left to the browser and still reach the very end.
  await page.keyboard.press('End')
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollHeight -
          window.innerHeight -
          window.scrollY,
      ),
    )
    .toBeLessThan(2)
})

test('the marquee follows the speed and direction of scrolling', async ({
  page,
}) => {
  test.slow()
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  const rate = () =>
    page.evaluate(
      () =>
        document
          .querySelector('.hero-marquee .marquee-track')!
          .getAnimations()[0]?.playbackRate ?? 0,
    )
  expect(await rate()).toBe(1)
  // Room to travel in both directions without reaching either end.
  await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }))

  // Scrolls at a steady speed, whatever the frame rate, until the marquee has
  // responded or the time is up, and reports the rate it reached.
  const drive = (speed: number) =>
    page.evaluate(
      (pixelsPerMs) =>
        new Promise<number>((resolve) => {
          const track = document.querySelector('.hero-marquee .marquee-track')!
          const started = performance.now()
          let last = started
          const tick = (now: number) => {
            window.scrollBy({
              top: pixelsPerMs * (now - last),
              behavior: 'instant',
            })
            last = now
            const reached = track.getAnimations()[0]?.playbackRate ?? 0
            const responded = reached * Math.sign(pixelsPerMs) > 1.5
            if (responded || now - started > 6000) resolve(reached)
            else requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }),
      speed,
    )
  expect(await drive(0.5)).toBeGreaterThan(1.5)
  expect(await drive(-0.5)).toBeLessThan(-1.5)
  // At rest it returns to its ordinary speed, still heading the last way.
  await expect.poll(rate).toBe(-1)
})

test('the headline letters rise toward the pointer without any layout work', async ({
  page,
}) => {
  // Nothing here depends on speed, and a busy machine draws slowly.
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
  await expect(page.locator('.hero-title')).toHaveAttribute('data-kinetic', '')
  // How far each letter of the first line is stretched, and its weight.
  const letters = () =>
    page.evaluate(() =>
      Array.from(document.querySelectorAll('.line-back .ch'), (letter) => {
        const style = getComputedStyle(letter)
        return {
          stretch: new DOMMatrix(style.transform).d,
          weight: Number(style.fontWeight),
        }
      }),
    )
  const tallest = async () =>
    Math.max(...(await letters()).map((letter) => letter.stretch))
  expect(await tallest()).toBe(1)
  // How far the tops of the first line's letters are from the labels above.
  const headroom = () =>
    page.evaluate(() => {
      const ceiling = document
        .querySelector('.hero-meta')!
        .getBoundingClientRect().bottom
      return Math.min(
        ...Array.from(
          document.querySelectorAll('.line-back .ch'),
          (letter) => letter.getBoundingClientRect().top - ceiling,
        ),
      )
    })
  const resting = await headroom()

  // The pointer is ignored until the letters have arrived, so keep nudging.
  const first = await page.locator('.line-back .ch').first().boundingBox()
  expect(first).not.toBeNull()
  let nudge = 0
  await expect
    .poll(
      async () => {
        nudge = (nudge + 1) % 5
        await page.mouse.move(
          first!.x + first!.width / 2 + nudge,
          first!.y + first!.height / 2,
        )
        return tallest()
      },
      { timeout: 20_000 },
    )
    .toBeGreaterThan(1.12)
  // However far they swell, they stop short of the labels above them. A
  // leaning letter's corner may rise a few pixels more than its edge.
  expect(await headroom()).toBeGreaterThanOrEqual(Math.min(resting, 4) - 3.5)
  // Letters far from the pointer stay put, no weight changes, and the name
  // of the heading is untouched.
  const reached = await letters()
  expect(reached.at(-1)!.stretch).toBe(1)
  expect(new Set(reached.map((letter) => letter.weight))).toEqual(
    new Set([380]),
  )
  await expect(page.getByRole('heading', { level: 1 })).toHaveAccessibleName(
    'Build boldly. Start safely.',
  )

  // Sweeping the pointer across the headline moves letters on every frame.
  // None of it may make the browser lay the page out again.
  const client = await page.context().newCDPSession(page)
  await client.send('Performance.enable')
  const layouts = async () => {
    const { metrics } = await client.send('Performance.getMetrics')
    return metrics.find((metric) => metric.name === 'LayoutCount')?.value ?? 0
  }
  const before = await layouts()
  for (let step = 0; step <= 40; step += 1) {
    await page.mouse.move(
      first!.x + step * 22,
      first!.y + first!.height / 2 + 20 * Math.sin(step / 3),
    )
  }
  expect(await tallest()).toBeGreaterThan(1.05)
  expect((await layouts()) - before).toBeLessThanOrEqual(2)

  await page.mouse.move(1400, 880)
  await expect.poll(tallest).toBe(1)
})

test('the roadmap travels sideways while pinned and ends fully in view', async ({
  page,
}) => {
  test.slow()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  await expect(page.locator('.journey')).toHaveAttribute('data-journey', '')
  const geometry = () =>
    page.evaluate(() => {
      const journey = document.querySelector<HTMLElement>('.journey')!
      const pin = journey.querySelector('.journey-pin')!
      const phases = Array.from(journey.querySelectorAll('.phase'), (phase) =>
        phase.getBoundingClientRect(),
      )
      return {
        top: journey.getBoundingClientRect().top + window.scrollY,
        distance: parseFloat(journey.style.getPropertyValue('--jd')),
        pinTop: pin.getBoundingClientRect().top,
        lefts: phases.map((phase) => phase.left),
        lastRight: phases.at(-1)!.right,
        overflows: document.documentElement.scrollWidth > window.innerWidth,
      }
    })
  const start = await geometry()
  expect(start.distance).toBeGreaterThan(500)
  expect(start.lefts).toHaveLength(4)
  // The phases sit side by side, not stacked.
  expect(start.lefts[1]! - start.lefts[0]!).toBeGreaterThan(500)

  // The section starts at a fractional offset and scrolling snaps to whole
  // pixels, so positions are compared to within a pixel or so.
  const scrollTo = (top: number) =>
    page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)
  const drift = async (travelled: number) =>
    Math.abs((await geometry()).lefts[0]! - (start.lefts[0]! - travelled))
  await scrollTo(start.top + start.distance / 2)
  await expect.poll(() => drift(start.distance / 2)).toBeLessThanOrEqual(1.5)
  expect(Math.abs((await geometry()).pinTop)).toBeLessThan(1)

  await scrollTo(start.top + start.distance)
  await expect.poll(() => drift(start.distance)).toBeLessThanOrEqual(1.5)
  const end = await geometry()
  expect(Math.abs(end.pinTop)).toBeLessThan(1)
  expect(end.lefts.at(-1)).toBeGreaterThanOrEqual(0)
  expect(end.lastRight).toBeLessThanOrEqual(1440)
  expect(end.overflows).toBe(false)
  await expect(
    page.getByRole('heading', { name: 'Agents & evaluation' }),
  ).toBeInViewport()
})

test('the footer waits under the page and is uncovered at the end', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
  const finale = page.locator('.finale')
  const footer = page.locator('.footer')
  const link = page.getByRole('link', { name: 'Back to top' })
  await expect(finale).toHaveAttribute('data-under', '')
  await expect(footer).toHaveCSS('opacity', '0')

  // Focus must never land on something hidden: it brings the footer up.
  await link.focus()
  await expect(footer).toHaveAttribute('data-shown', '')
  await expect(footer).toHaveCSS('opacity', '1')
  await expect(link).toBeInViewport()
  expect(
    await link.evaluate((node) => {
      const box = node.getBoundingClientRect()
      const topmost = document.elementFromPoint(
        box.left + box.width / 2,
        box.top + box.height / 2,
      )
      return topmost !== null && node.contains(topmost)
    }),
  ).toBe(true)
  await link.click()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

  // Too tall for the screen: it returns to the normal flow, all reachable.
  await page.setViewportSize({ width: 1440, height: 560 })
  await expect(finale).not.toHaveAttribute('data-under', '')
  await expect(footer).toHaveCSS('opacity', '1')
  await expect(footer).toHaveCSS('position', 'relative')
})

test('the preflight drawing and its rulers follow the limits', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
  const stage = page.locator('.preview-stage')
  await stage.scrollIntoViewIfNeeded()
  // It settles on the real-time drawing or the flat schematic.
  await expect(stage).not.toHaveAttribute('data-gl', 'pending')
  const timeout = page.locator('.ruler-y')
  const memory = page.locator('.ruler-x')
  await expect(timeout).toContainText('300 s')
  await expect(memory).toContainText('512 MiB')
  const fill = (ruler: typeof timeout) =>
    ruler.evaluate((node) =>
      parseFloat((node as HTMLElement).style.getPropertyValue('--fill')),
    )
  // Whichever drawing is in use has to sit inside its frame, not beside it.
  const placement = () =>
    page.evaluate(() => {
      const frame = document
        .querySelector('.viewport-frame')!
        .getBoundingClientRect()
      const stage = document.querySelector<HTMLElement>('.preview-stage')!
      const flat = stage.dataset.gl === 'fallback'
      const parts = flat
        ? Array.from(stage.querySelectorAll('.schematic-plate'))
        : [stage.querySelector('canvas')!]
      const boxes = parts.map((part) => part.getBoundingClientRect())
      const top = Math.min(...boxes.map((box) => box.top))
      const bottom = Math.max(...boxes.map((box) => box.bottom))
      const left = Math.min(...boxes.map((box) => box.left))
      const right = Math.max(...boxes.map((box) => box.right))
      return {
        flat,
        plates: parts.length,
        height: bottom - top,
        // Where the drawing's centre falls across and down the frame, 0 to 1.
        across: ((left + right) / 2 - frame.left) / frame.width,
        down: ((top + bottom) / 2 - frame.top) / frame.height,
        // Only the flat drawing is measured plate by plate; the canvas is
        // larger than what it draws.
        clipped: flat && (top < frame.top || bottom > frame.bottom),
      }
    })
  const before = { timeout: await fill(timeout), memory: await fill(memory) }
  const resting = await placement()
  expect(resting.height).toBeGreaterThan(60)
  expect(resting.across).toBeGreaterThan(0.35)
  expect(resting.across).toBeLessThan(0.65)
  expect(resting.down).toBeGreaterThan(0.3)
  expect(resting.down).toBeLessThan(0.7)
  expect(resting.clipped).toBe(false)

  await page.getByLabel('Timeout (seconds)').fill('900')
  await page.getByLabel('Memory (MiB)').fill('128')
  await expect(timeout).toContainText('900 s')
  await expect(memory).toContainText('128 MiB')
  expect(await fill(timeout)).toBe(100)
  expect(await fill(memory)).toBe(0)
  expect(before.timeout).toBeLessThan(100)
  expect(before.memory).toBeGreaterThan(0)

  // The tallest and widest drawing still fits the frame.
  await page.getByLabel('Memory (MiB)').fill('2048')
  await expect(memory).toContainText('2048 MiB')
  await expect
    .poll(async () => {
      const largest = await placement()
      return !largest.flat || largest.plates === 21
    })
    .toBe(true)
  const largest = await placement()
  expect(largest.clipped).toBe(false)
  expect(largest.down).toBeGreaterThan(0.3)
  expect(largest.down).toBeLessThan(0.7)
  if (largest.flat) expect(largest.height).toBeGreaterThan(resting.height)
})

test('the latency figure rolls to the number that was measured', async ({
  page,
}) => {
  test.slow()
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
  const figure = page.locator('.readout-value')
  await figure.scrollIntoViewIfNeeded()
  // Readers get the plain number; the rolling digits are decoration.
  const measured = (await figure.locator('.sr-only').textContent()) ?? ''
  expect(measured).toMatch(/^\d+$/)
  await expect(figure.locator('.odometer-column')).toHaveCount(measured.length)
  // Once it has stopped, the digit standing in each window is the right one.
  const showing = () =>
    figure.locator('.odometer-column').evaluateAll((columns) =>
      columns
        .map((column) => {
          const frame = column.getBoundingClientRect()
          const middle = (frame.top + frame.bottom) / 2
          const digit = Array.from(
            column.querySelectorAll('.odometer-strip > span'),
          ).find((row) => {
            const box = row.getBoundingClientRect()
            return box.top <= middle && box.bottom > middle
          })
          return digit?.textContent ?? '?'
        })
        .join(''),
    )
  await expect.poll(showing, { timeout: 15_000 }).toBe(measured)
  // Each digit comes to rest squarely in its window, not part-way through,
  // and the rows of its neighbours lie wholly outside that window.
  const rest = () =>
    figure.locator('.odometer-column').evaluateAll((columns) => {
      let offCentre = 0
      let clearance = Infinity
      for (const column of columns) {
        const turns = Number(
          (column as HTMLElement).style.getPropertyValue('--d'),
        )
        const rows = column.querySelectorAll('.odometer-strip > span')
        const frame = column.getBoundingClientRect()
        const row = rows[turns]!.getBoundingClientRect()
        offCentre = Math.max(
          offCentre,
          Math.abs((row.top + row.bottom - frame.top - frame.bottom) / 2),
        )
        // The window is the column's box plus what its clip adds each way.
        const style = getComputedStyle(column)
        const clip = /inset\((-?[\d.]+)(px|em)/.exec(style.clipPath)
        const extra = clip
          ? Math.abs(parseFloat(clip[1]!)) *
            (clip[2] === 'em' ? parseFloat(style.fontSize) : 1)
          : 0
        const above = rows[turns - 1]?.getBoundingClientRect()
        const below = rows[turns + 1]?.getBoundingClientRect()
        if (above) {
          clearance = Math.min(clearance, frame.top - extra - above.bottom)
        }
        if (below) {
          clearance = Math.min(clearance, below.top - frame.bottom - extra)
        }
      }
      return { offCentre, clearance }
    })
  await expect
    .poll(async () => (await rest()).offCentre, { timeout: 15_000 })
    .toBeLessThan(1)
  expect((await rest()).clearance).toBeGreaterThan(0)
})

test('scrolling and resting cost no layout work once the page has settled', async ({
  page,
}) => {
  // Layouts are counted, not timed, and a busy machine draws slowly.
  test.setTimeout(180_000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('.preloader')).toHaveCount(0)
  await expect(page.getByText('PostgreSQL connected')).toBeVisible()
  const client = await page.context().newCDPSession(page)
  await client.send('Performance.enable')
  const layouts = async () => {
    const { metrics } = await client.send('Performance.getMetrics')
    return metrics.find((metric) => metric.name === 'LayoutCount')?.value ?? 0
  }
  // Scrolls from one position to another at a steady pace, one step per
  // frame, and reports how many frames that took.
  const travel = (from: number, to: number, duration = 1500) =>
    page.evaluate(
      ([start, end, time]) =>
        new Promise<number>((resolve) => {
          let frames = 0
          const began = performance.now()
          const tick = (now: number) => {
            const progress = Math.min(Math.max((now - began) / time, 0), 1)
            window.scrollTo({
              top: start + (end - start) * progress,
              behavior: 'instant',
            })
            frames += 1
            if (progress < 1) requestAnimationFrame(tick)
            else resolve(frames)
          }
          requestAnimationFrame(tick)
        }),
      [from, to, duration] as const,
    )

  // One slow pass over the whole page first, a part of a screen at a time, so
  // that every section reveals itself, every label decodes and the latency
  // rolls, each once. Then everything comes to rest.
  await page.evaluate(async () => {
    const frame = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    const end = document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= end + 400; y += 400) {
      window.scrollTo({ top: Math.min(y, end), behavior: 'instant' })
      await frame()
      await frame()
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
    await frame()
  })
  await page.waitForTimeout(3500)

  // At rest, with the hero and its animations on screen.
  let before = await layouts()
  await page.waitForTimeout(1000)
  expect((await layouts()) - before).toBeLessThanOrEqual(1)

  // While the page slides over the pinned hero and the premise lights up
  // word by word, there and back.
  before = await layouts()
  const overHero = (await travel(0, 800)) + (await travel(800, 0))
  expect(overHero).toBeGreaterThan(3)
  expect((await layouts()) - before).toBeLessThanOrEqual(1)

  // And over the whole page, through every section, the pinned roadmap and
  // the footer under the page, there and back.
  const journey = await page.evaluate(() => {
    const node = document.querySelector<HTMLElement>('.journey')!
    return {
      pinned: node.hasAttribute('data-journey'),
      distance: parseFloat(node.style.getPropertyValue('--jd')),
      end: document.documentElement.scrollHeight - window.innerHeight,
    }
  })
  expect(journey.pinned).toBe(true)
  expect(journey.distance).toBeGreaterThan(500)
  before = await layouts()
  const whole =
    (await travel(0, journey.end, 4000)) + (await travel(journey.end, 0, 4000))
  expect(whole).toBeGreaterThan(6)
  expect((await layouts()) - before).toBeLessThanOrEqual(2)
})

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

import { test, expect } from '@playwright/test'

test('database outage fails readiness and the dashboard without failing liveness', async ({
  request,
  page,
}) => {
  await expect
    .poll(async () =>
      (await request.get('/actuator/health/readiness')).status(),
    )
    .toBe(503)
  const live = await request.get('/actuator/health/liveness')
  expect(live.status()).toBe(200)
  expect(await live.json()).toStrictEqual({ status: 'UP' })
  const system = await request.get('/api/v1/system')
  expect(system.status()).toBe(503)
  expect(system.headers()['content-type']).toContain('application/problem+json')
  expect(await system.json()).toMatchObject({
    status: 503,
    title: 'Service unavailable',
  })
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('System unavailable')
  await expect(page.getByText('PostgreSQL connected')).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Retry connection' }),
  ).toBeVisible()
})

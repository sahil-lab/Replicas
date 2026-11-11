import { defineConfig, devices } from '@playwright/test'

const mode = process.env.TEST_MODE ?? 'healthy'
if (mode !== 'healthy' && mode !== 'outage') {
  throw new Error(`Unsupported TEST_MODE: ${mode}`)
}
const outputDir = process.env.PLAYWRIGHT_OUTPUT_DIR ?? 'test-results'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: mode === 'outage' ? 'outage.spec.ts' : 'smoke.spec.ts',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  workers: 1,
  retries: 0,
  forbidOnly: true,
  outputDir,
  reporter: [['list'], ['json', { outputFile: `${outputDir}/results.json` }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://web:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})

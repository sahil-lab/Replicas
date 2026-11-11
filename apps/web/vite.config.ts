import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  // The gateway's content-security policy has no data: font source.
  build: { assetsInlineLimit: 0 },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    maxWorkers: 1,
    clearMocks: true,
    restoreMocks: true,
  },
})

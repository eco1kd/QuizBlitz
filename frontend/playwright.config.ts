import { defineConfig } from '@playwright/test'

// Isolated ports keep tests independent of a developer's open localhost demo.
const demoUrl = 'http://127.0.0.1:5180'
const liveUrl = 'http://127.0.0.1:5181'
const apiUrl = 'http://127.0.0.1:3101'

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: demoUrl,
    channel: process.platform === 'darwin' ? 'chrome' : undefined,
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node --import tsx src/index.ts',
      cwd: '../backend',
      url: `${apiUrl}/health`,
      env: { PORT: '3101', AI_API_KEY: '' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5180 --strictPort',
      url: demoUrl,
      env: { VITE_GAME_MODE: 'mock', VITE_AUTH_MODE: 'demo' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5181 --strictPort',
      url: liveUrl,
      env: {
        VITE_GAME_MODE: 'live',
        VITE_AUTH_MODE: 'demo',
        VITE_BACKEND_URL: apiUrl,
      },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5182 --strictPort',
      url: 'http://127.0.0.1:5182',
      env: {
        VITE_GAME_MODE: 'mock',
        VITE_AUTH_MODE: 'live',
        VITE_API_URL: apiUrl,
      },
      reuseExistingServer: false,
    },
  ],
})

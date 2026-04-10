import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/tests/**'
      ],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 70
      }
    },
    include: ['tests/**/*.test.ts'],
    reporters: ['verbose'],
    onConsoleLog: (log) => {
      if (log.includes('Failed to') || log.includes('Sign in failed')) {
        return false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

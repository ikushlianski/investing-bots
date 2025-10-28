import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'

const config = defineConfig({
  plugins: [
    !isTest &&
      cloudflare({
        viteEnvironment: { name: 'ssr' },
        persistState: true,
        configPath: './wrangler.jsonc',
      }),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    !isTest && tanstackStart(),
    viteReact(),
  ].filter(Boolean),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    teardownTimeout: 2000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/*.gen.ts',
        '**/test-setup.ts',
        '**/*.test.{ts,tsx}',
      ],
    },
  },
})

export default config

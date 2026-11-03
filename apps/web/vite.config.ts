/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Files edited through the Claude desktop app bridge do not always trigger
    // Windows file-change events, so Vite would keep serving old code.
    // Polling checks files for changes instead. Dev server only.
    watch: { usePolling: true, interval: 300 },
  },
  test: {
    // Unit tests for pure logic (money, randomization, permissions). Run: npm test
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      // "@/components/x" -> "src/components/x" (must match "paths" in tsconfig)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

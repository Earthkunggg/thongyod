import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@/components/x" -> "src/components/x" (must match "paths" in tsconfig)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

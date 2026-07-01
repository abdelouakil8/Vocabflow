import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // Order matters: Tailwind → TanStack Start → React → Nitro.
    // Nitro emits the Vercel Build Output API format (auto-detected on Vercel).
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro(),
  ],
})

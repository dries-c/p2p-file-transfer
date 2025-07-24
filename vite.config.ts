import {cloudflare} from '@cloudflare/vite-plugin'
import {defineConfig} from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
  return {
    plugins: [tailwindcss(), cloudflare()],
  }
})

import { defineConfig } from 'astro/config'
import preact from '@astrojs/preact'
import netlify from '@astrojs/netlify'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  integrations: [preact()],
  output: 'server',
  adapter: netlify(),
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
})

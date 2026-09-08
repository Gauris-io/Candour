import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy only exact API paths — prevents static assets like /checker.jpg being forwarded
      '^/check$':  'http://localhost:8000',
      '^/query$':  'http://localhost:8000',
      '^/health$': 'http://localhost:8000',
    },
  },
})


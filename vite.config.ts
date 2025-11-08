import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6170,
    proxy: {
      '/api/bored': {
        target: 'https://bored-api.appbrewery.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bored/, ''),
      },
    },
  },
})


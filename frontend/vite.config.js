import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // In production the React app talks directly to the Render backend URL.
  // In development the Vite dev-server proxies /api to localhost:5000
  // so you never need to touch CORS during local development.
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  // Make the backend URL available inside the bundle as import.meta.env.VITE_API_URL
  // Render injects this as a build-time env var via the Static Site settings.
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}))

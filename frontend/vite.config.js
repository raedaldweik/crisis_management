import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: the React shell runs on :5173 and proxies the API + the static dashboards to the
// FastAPI backend on :8000. In production everything is served from FastAPI on one port.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/dashboards': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      axios: "/src/axios",
      "@/examples": "/src/examples",
    },
  },
  server: {
    open: true,
    force: true,
  },
})

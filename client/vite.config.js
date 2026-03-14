import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
    server: {
    host: true,
    hmr: {
      host: 'hackathon.acrossthe.cloud',
      port: 443,
      protocol: 'wss'
    },
    allowedHosts: ['hackathon.acrossthe.cloud'],
  },
})

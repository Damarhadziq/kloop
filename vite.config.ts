import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import http from 'node:http'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === 'development'

  return {
    base: '/',
    build: {
      sourcemap: emitSourcemaps ? 'inline' : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      mobileTunnelMirrorPortPlugin(5173),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      strictPort: false,
      allowedHosts: true,
      cors: true,
    },
    preview: {
      host: '0.0.0.0',
      port: parseInt(process.env.PORT || '8443'),
      allowedHosts: true,
      cors: true,
    },
  }
})

/**
 * Exposes an additional standard HTTP mirror port (5173) alongside 8443
 * so port forwarding / Dev Tunnels work out-of-the-box over HTTP.
 */
function mobileTunnelMirrorPortPlugin(mirrorPort = 5173): Plugin {
  let mirrorServer: http.Server | null = null
  return {
    name: 'mobile-tunnel-mirror-port',
    apply: 'serve',
    configureServer(server) {
      if (mirrorServer) return
      mirrorServer = http.createServer((req, res) => {
        server.middlewares(req, res)
      })
      mirrorServer.on('error', () => {
        /* ignore if port 5173 is already in use */
      })
      mirrorServer.listen(mirrorPort, '0.0.0.0')
      server.httpServer?.once('close', () => {
        mirrorServer?.close()
        mirrorServer = null
      })
    },
  }
}

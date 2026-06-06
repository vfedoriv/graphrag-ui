import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { spawn, spawnSync } from 'node:child_process'
import { access } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'

const localOpenPath = '/__graphrag-ui/open-local-file'

export default defineConfig({
  plugins: [localFileOpenPlugin(), react(), tailwindcss()],
  server: {
    port: 8333,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

function localFileOpenPlugin() {
  return {
    name: 'graphrag-local-file-open',
    configureServer(server) {
      server.middlewares.use(localOpenPath, async (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { detail: 'Method not allowed' })
          return
        }

        if (!isLoopbackRequest(req)) {
          sendJson(res, 403, { detail: 'Local file opening is only available from loopback clients.' })
          return
        }

        try {
          const body = await readJsonBody(req)
          const path = typeof body.path === 'string' ? body.path.trim() : ''
          if (!path) {
            sendJson(res, 400, { detail: 'A local file path is required.' })
            return
          }

          await openWithDefaultApp(path)
          sendJson(res, 202, { status: 'OPEN_REQUESTED' })
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Unable to open local file.'
          sendJson(res, 500, { detail })
        }
      })
    },
  } satisfies import('vite').Plugin
}

function isLoopbackRequest(req: IncomingMessage) {
  const remoteAddress = req.socket.remoteAddress
  return (
    remoteAddress === '127.0.0.1' ||
    remoteAddress === '::1' ||
    remoteAddress === '::ffff:127.0.0.1' ||
    remoteAddress === undefined
  )
}

async function readJsonBody(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {}
}

async function openWithDefaultApp(path: string) {
  await access(path)
  const [command, args] = getOpenCommand(path)

  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    let settled = false
    child.once('error', (error) => {
      settled = true
      reject(error)
    })
    child.once('close', (code) => {
      if (settled) return
      settled = true
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`OS opener exited with code ${code ?? 'unknown'}.`))
      }
    })
    setTimeout(() => {
      if (settled) return
      settled = true
      child.unref()
      resolve()
    }, 1000)
  })
}

function getOpenCommand(path: string): [string, string[]] {
  if (process.platform === 'darwin') return ['open', [path]]
  if (process.platform === 'win32') return ['cmd', ['/c', 'start', '', path]]
  if (commandExists('gio')) return ['gio', ['open', path]]
  return ['xdg-open', [path]]
}

function commandExists(command: string) {
  const result = spawnSync('command', ['-v', command], {
    shell: true,
    stdio: 'ignore',
  })
  return result.status === 0
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

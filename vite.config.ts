import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'

// In-memory cross-device / cross-window pairing registry
let activePairingCode = '824457';
let activePairingExpiry = Date.now() + 15 * 60 * 1000;
const knownPairingCodes = new Set<string>(['824457', '482910', '123456', '719382', '246810', '582914']);

const pairingSyncPlugin = (): Plugin => ({
  name: 'adept-pairing-sync',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost:5173'}`);
      if (url.pathname === '/api/pairing-code') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              code: activePairingCode,
              expiresAt: activePairingExpiry,
              knownCodes: Array.from(knownPairingCodes),
            })
          );
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.code) {
                activePairingCode = String(data.code).trim();
                activePairingExpiry = data.expiresAt || Date.now() + 15 * 60 * 1000;
                knownPairingCodes.add(activePairingCode);
              }
            } catch {}
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, code: activePairingCode }));
          });
          return;
        }
      }
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), pairingSyncPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})

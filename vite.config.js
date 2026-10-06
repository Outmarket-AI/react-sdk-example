import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mintSession } from './server/mint-session.js';

// The dev server doubles as this example's backend. In your app, both pieces below
// belong to your own server.
//
// It listens on this machine only, because the session route hands out a real
// Outmarket session. Don't expose it with `--host` or a tunnel.
const PORT = 5173;
const LOCAL_HOSTS = [`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // every variable in .env, server side only

  return {
    plugins: [react(), outmarketSessionRoute(env)],
    server: { host: 'localhost', port: PORT, strictPort: true, proxy: outmarketProxy(env) },
  };
});

// POST /api/outmarket-session: runs mintSession() in Node, where the API key lives.
//
// Dev only: it stands in for your backend and serves one local user. Your real route
// must check that the caller is signed in to your app, take the email from that user's
// record on your server, keep one session per signed-in user, and answer only your own
// site. See "Before you copy the session route" in the README.
function outmarketSessionRoute(env) {
  // Mint once and keep it, like a backend that mints when the user signs in and
  // hands the same session to the page on every load. The SDK refreshes it itself.
  // If the session ends (you signed out, or 30 days passed), restart the dev server.
  let session;

  return {
    name: 'outmarket-session-route',
    configureServer(server) {
      server.middlewares.use('/api/outmarket-session', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        if (!isFromThisPage(req)) {
          res.statusCode = 403;
          res.end();
          return;
        }
        session ??= mintSession(env);
        const { status, body } = await session;
        if (status !== 201) session = undefined; // retry the mint on the next request
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store'); // the body holds the user's tokens
        res.end(JSON.stringify(body));
      });
    },
  };
}

// Only this app's own page, opened on this machine. Browsers always send Origin on a
// POST, so a request from another site, or through another host name (a LAN address,
// a tunnel), is refused.
function isFromThisPage(req) {
  const { host, origin } = req.headers;
  return LOCAL_HOSTS.includes(host) && origin === `http://${host}`;
}

// /outmarket/{api,nexus,gateway}/*: forwards the SDK's calls to Outmarket. Outmarket only
// accepts browser calls from origins it has allow-listed, and localhost is not one of them,
// so the page calls this server instead (see `apiUrls` in src/App.jsx).
function outmarketProxy(env) {
  const upstreams = {
    api: env.OUTMARKET_API_URL || 'https://api.prod.outmarket.ai',
    nexus: env.OUTMARKET_NEXUS_URL || 'https://nexus.prod.outmarket.ai',
    gateway: env.OUTMARKET_GATEWAY_URL || 'https://gateway.outmarket.ai',
  };
  return Object.fromEntries(
    Object.entries(upstreams).map(([name, target]) => [
      `/outmarket/${name}`,
      {
        target,
        changeOrigin: true,
        rewrite: (path) => path.slice(`/outmarket/${name}`.length),
        // A server-to-server call carries no Origin header.
        configure: (proxy) => proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin')),
      },
    ]),
  );
}

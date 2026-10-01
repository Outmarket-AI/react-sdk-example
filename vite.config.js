import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { mintSession } from './server/mint-session.js';

// The dev server doubles as this example's backend. In your app, both pieces below
// belong to your own server.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // every variable in .env, server side only

  return {
    plugins: [react(), outmarketSessionRoute(env)],
    server: { port: 5173, strictPort: true, proxy: outmarketProxy(env) },
  };
});

// POST /api/outmarket-session: runs mintSession() in Node, where the API key lives.
function outmarketSessionRoute(env) {
  // Mint once and keep it, like a backend that mints when the user signs in and
  // hands the same session to the page on every load. The SDK refreshes it itself.
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

import { useEffect, useState } from 'react';
import {
  MODULE_TITLE,
  OutmarketProvider,
  OutmarketWorkflowConversation,
  OutmarketWorkflowForm,
  OutmarketWorkflowsList,
} from '@outmarket-ai/react-sdk';
import '@outmarket-ai/react-sdk/styles.css';

// Which Outmarket environment the SDK talks to. Production unless you set it.
const environment = import.meta.env.VITE_OUTMARKET_ENVIRONMENT || 'production';

// The SDK calls Outmarket through this app's own server (the proxy in vite.config.js),
// so it works from localhost. Once Outmarket allow-lists your site's origin, you can
// drop `apiUrls` and let the SDK call Outmarket directly.
const apiUrls = {
  api: '/outmarket/api/v1',
  nexus: '/outmarket/nexus/api/v1',
  gateway: '/outmarket/gateway/api/v1',
};

export default function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [modules, setModules] = useState([]);
  const [module, setModule] = useState('commercial_lines');
  const [view, setView] = useState({ kind: 'list' });

  // 1. Ask your own backend for the session it minted for the signed-in user.
  useEffect(() => {
    fetch('/api/outmarket-session', { method: 'POST' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(`${response.status} ${JSON.stringify(body)}`);
        setSession(body);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <pre style={{ padding: 16 }}>Could not get a session: {error}</pre>;
  if (!session) return <p style={{ padding: 16 }}>Signing in…</p>;

  // 2. Pass the session to the SDK unchanged, then show its components.
  return (
    <OutmarketProvider
      session={session}
      environment={environment}
      apiUrls={apiUrls}
      onReady={({ workflowsByModule }) => {
        const available = Object.keys(workflowsByModule).filter((m) => workflowsByModule[m].length > 0);
        setModules(available);
        if (available.length > 0 && !available.includes(module)) setModule(available[0]);
      }}
    >
      <header>
        {modules.map((m) => (
          <button key={m} disabled={m === module && view.kind === 'list'} onClick={() => { setModule(m); setView({ kind: 'list' }); }}>
            {MODULE_TITLE[m]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}>{session.user.email} · {session.instance.name}</span>
      </header>

      <main>
        {view.kind === 'list' && (
          <OutmarketWorkflowsList
            module={module}
            onSelectWorkflow={(workflowId) => setView({ kind: 'form', workflowId })}
          />
        )}
        {view.kind === 'form' && (
          <OutmarketWorkflowForm
            workflowId={view.workflowId}
            onConversationCreated={(conversationId) => setView({ kind: 'conversation', conversationId })}
          />
        )}
        {view.kind === 'conversation' && <OutmarketWorkflowConversation conversationId={view.conversationId} />}
      </main>
    </OutmarketProvider>
  );
}

import { useEffect, useState } from 'react';
import { MODULE_TITLE, OutmarketProvider } from '@outmarket-ai/react-sdk';
import '@outmarket-ai/react-sdk/styles.css';
import EndorsementCheck from './EndorsementCheck.jsx';
import Module from './Module.jsx';
import Vault from './Vault.jsx';
import Workflow from './Workflow.jsx';

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

// The Vault keeps its folder in the page's URL (see Vault.jsx), so a URL with ?tab= is the Vault.
const isVaultUrl = () => new URLSearchParams(window.location.search).has('tab');
// The Endorsement Check keeps its open check there too (see EndorsementCheck.jsx): ?check= is the Endorsement Check.
const isEndorsementCheckUrl = () => new URLSearchParams(window.location.search).has('check');

function viewFromUrl() {
  if (isVaultUrl()) return { kind: 'vault' };
  if (isEndorsementCheckUrl()) return { kind: 'endorsement_check' };
  return { kind: 'list' };
}

export default function App() {
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [modules, setModules] = useState([]);
  const [module, setModule] = useState('commercial_lines');
  const [hasVault, setHasVault] = useState(false);
  const [hasEndorsementCheck, setHasEndorsementCheck] = useState(false);
  const [view, setView] = useState(viewFromUrl);

  // Back and Forward between the workflows, the Vault and the Endorsement Check.
  useEffect(() => {
    const onPopState = () => {
      const next = viewFromUrl();
      if (next.kind !== 'list') setView(next);
      else setView((current) => (current.kind === 'vault' || current.kind === 'endorsement_check' ? next : current));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const showModule = (m) => {
    if (isVaultUrl() || isEndorsementCheckUrl()) window.history.pushState(null, '', window.location.pathname);
    setModule(m);
    setView({ kind: 'list' });
  };

  const showVault = () => {
    if (!isVaultUrl()) window.history.pushState(null, '', '?tab=shared&path=');
    setView({ kind: 'vault' });
  };

  const showEndorsementCheck = () => {
    if (!isEndorsementCheckUrl()) window.history.pushState(null, '', '?check=');
    setView({ kind: 'endorsement_check' });
  };

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
      onReady={({ workflowsByModule, features }) => {
        const available = Object.keys(workflowsByModule).filter((m) => workflowsByModule[m].length > 0);
        setModules(available);
        if (available.length > 0 && !available.includes(module)) setModule(available[0]);
        // Offer the Vault and the Endorsement Check only when the user's workspace and plan include them.
        setHasVault(features.vault);
        setHasEndorsementCheck(features.endorsementCheck);
      }}
    >
      <header>
        {modules.map((m) => (
          <button key={m} disabled={m === module && view.kind === 'list'} onClick={() => showModule(m)}>
            {MODULE_TITLE[m]}
          </button>
        ))}
        {hasVault && (
          <button disabled={view.kind === 'vault'} onClick={showVault}>
            Vault
          </button>
        )}
        {hasEndorsementCheck && (
          <button disabled={view.kind === 'endorsement_check'} onClick={showEndorsementCheck}>
            Endorsement Check
          </button>
        )}
        <span style={{ marginLeft: 'auto' }}>{session.user.email} · {session.instance.name}</span>
      </header>

      <main>
        {view.kind === 'list' && (
          <Module
            key={module}
            module={module}
            onSelectWorkflow={(workflowId) => setView({ kind: 'workflow', workflowId })}
          />
        )}
        {view.kind === 'workflow' && <Workflow key={view.workflowId} workflowId={view.workflowId} />}
        {view.kind === 'vault' && <Vault />}
        {view.kind === 'endorsement_check' && <EndorsementCheck onCancel={() => showModule(module)} />}
      </main>
    </OutmarketProvider>
  );
}

import { useEffect, useState } from 'react';
import { OutmarketVault, OutmarketWorkflowConversation, OutmarketWorkflowHistory } from '@outmarket-ai/react-sdk';

const TABS = ['my', 'shared', 'team'];

// The folder in this page's URL (?tab=shared&path=Clients%2FTest+Client), or Shared's root.
function readLocation() {
  const params = new URLSearchParams(window.location.search);
  const tab = TABS.find((t) => t === params.get('tab')) ?? 'shared';
  return { tab, path: params.get('path') ?? '' };
}

// The Vault, with its folder kept in this page's URL: a reload opens the same folder, and the
// browser's Back button walks back through folders.
export default function Vault() {
  const [location, setLocation] = useState(readLocation);
  const [conversationId, setConversationId] = useState(null);

  // Back and Forward: hand the URL's folder to the Vault.
  useEffect(() => {
    const onPopState = () => setLocation(readLocation());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  if (conversationId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={{ alignSelf: 'flex-start' }} onClick={() => setConversationId(null)}>
          Back to the Vault
        </button>
        <OutmarketWorkflowConversation conversationId={conversationId} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      {/* Past Vault chats: the Vault has no History sidebar of its own. A chat opens in their place. */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <OutmarketWorkflowHistory vault onSelectConversation={setConversationId} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <OutmarketVault
          location={location}
          onLocationChange={(next) => {
            setLocation(next);
            const url = new URL(window.location.href);
            url.searchParams.set('tab', next.tab);
            url.searchParams.set('path', next.path);
            window.history.pushState(null, '', url);
          }}
          onOpenConversation={setConversationId}
        />
      </div>
    </div>
  );
}

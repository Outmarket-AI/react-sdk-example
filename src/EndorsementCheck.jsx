import { useEffect, useState } from 'react';
import { OutmarketEndorsementCheck, OutmarketWorkflowHistory } from '@outmarket-ai/react-sdk';

// The open check in this page's URL (?check=<id>), or null for the intake (?check= with no id).
function readCheck() {
  return new URLSearchParams(window.location.search).get('check') || null;
}

// The Endorsement Check beside the user's past checks, with the open check kept in the page's URL: a
// reload opens the same check, and the browser's Back button returns to the intake. The Endorsement
// Check lists no past checks itself: <OutmarketWorkflowHistory endorsementCheck> does, and a check
// picked there opens in its place.
export default function EndorsementCheck({ onCancel }) {
  const [conversationId, setConversationId] = useState(readCheck);

  // Back and Forward: hand the URL's check to the component.
  useEffect(() => {
    const onPopState = () => setConversationId(readCheck());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const showCheck = (next) => {
    setConversationId(next);
    const url = new URL(window.location.href);
    url.searchParams.set('check', next ?? '');
    window.history.pushState(null, '', url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <OutmarketWorkflowHistory endorsementCheck onSelectConversation={showCheck} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <OutmarketEndorsementCheck conversationId={conversationId} onConversationChange={showCheck} onCancel={onCancel} />
      </div>
    </div>
  );
}

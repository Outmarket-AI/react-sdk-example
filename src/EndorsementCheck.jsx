import { useEffect, useState } from 'react';
import { OutmarketEndorsementCheck } from '@outmarket-ai/react-sdk';

// The open check in this page's URL (?check=<id>), or null for the intake (?check= with no id).
function readCheck() {
  return new URLSearchParams(window.location.search).get('check') || null;
}

// The Endorsement Check, with the open check kept in the page's URL: a reload opens the same check,
// and the browser's Back button returns to the intake. Its intake lists the user's past checks itself.
export default function EndorsementCheck({ onCancel }) {
  const [conversationId, setConversationId] = useState(readCheck);

  // Back and Forward: hand the URL's check to the component.
  useEffect(() => {
    const onPopState = () => setConversationId(readCheck());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <div style={{ height: '100%' }}>
      <OutmarketEndorsementCheck
        conversationId={conversationId}
        onConversationChange={(next) => {
          setConversationId(next);
          const url = new URL(window.location.href);
          url.searchParams.set('check', next ?? '');
          window.history.pushState(null, '', url);
        }}
        onCancel={onCancel}
      />
    </div>
  );
}

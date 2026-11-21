import { useEffect, useState } from 'react';
import { OutmarketAssistant, OutmarketWorkflowHistory } from '@outmarket-ai/react-sdk';

// The open chat in this page's URL (?chat=<id>), or null for a new chat (?chat= with no id).
function readChat() {
  return new URLSearchParams(window.location.search).get('chat') || null;
}

// The Assistant beside the user's past chats, with the open chat kept in the page's URL: a reload opens
// the same chat, and the browser's Back button returns to the one before. The Assistant lists no past
// chats itself: <OutmarketWorkflowHistory assistant> does, and a chat picked there opens in its place.
export default function Assistant() {
  const [conversationId, setConversationId] = useState(readChat);

  // Back and Forward: hand the URL's chat to the component.
  useEffect(() => {
    const onPopState = () => setConversationId(readChat());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const showChat = (next) => {
    setConversationId(next);
    const url = new URL(window.location.href);
    url.searchParams.set('chat', next ?? '');
    window.history.pushState(null, '', url);
  };

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <OutmarketWorkflowHistory assistant onSelectConversation={showChat} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <OutmarketAssistant conversationId={conversationId} onConversationChange={showChat} />
      </div>
    </div>
  );
}

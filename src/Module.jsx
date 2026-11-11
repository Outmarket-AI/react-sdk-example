import { useState } from 'react';
import {
  OutmarketWorkflowConversation,
  OutmarketWorkflowHistory,
  OutmarketWorkflowsList,
} from '@outmarket-ai/react-sdk';

// One module: its workflows beside the user's past runs of them. A past run opens in their place.
export default function Module({ module, onSelectWorkflow }) {
  const [conversationId, setConversationId] = useState(null);

  if (conversationId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={{ alignSelf: 'flex-start' }} onClick={() => setConversationId(null)}>
          Back to the workflows
        </button>
        <OutmarketWorkflowConversation conversationId={conversationId} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <OutmarketWorkflowHistory module={module} onSelectConversation={setConversationId} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <OutmarketWorkflowsList module={module} onSelectWorkflow={onSelectWorkflow} />
      </div>
    </div>
  );
}

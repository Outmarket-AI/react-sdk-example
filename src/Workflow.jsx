import { useState } from 'react';
import {
  OutmarketWorkflowConversation,
  OutmarketWorkflowForm,
  OutmarketWorkflowHistory,
} from '@outmarket-ai/react-sdk';

// One workflow: its form beside its past runs. A run, new or past, opens in their place.
export default function Workflow({ workflowId }) {
  const [conversationId, setConversationId] = useState(null);

  if (conversationId) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button style={{ alignSelf: 'flex-start' }} onClick={() => setConversationId(null)}>
          Back to the workflow
        </button>
        <OutmarketWorkflowConversation conversationId={conversationId} />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', gap: 16 }}>
      <div style={{ width: 280, flexShrink: 0 }}>
        <OutmarketWorkflowHistory workflowId={workflowId} onSelectConversation={setConversationId} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <OutmarketWorkflowForm workflowId={workflowId} onConversationCreated={setConversationId} />
      </div>
    </div>
  );
}

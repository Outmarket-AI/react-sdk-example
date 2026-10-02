# Outmarket React SDK example

A minimal React app that embeds Outmarket workflows with
[`@outmarket-ai/react-sdk`](https://www.npmjs.com/package/@outmarket-ai/react-sdk).

It does three things:

1. **Your server** exchanges your Outmarket API key for a signed-in user's session.
2. **Your page** passes that session to `<OutmarketProvider>`.
3. **The SDK** renders Outmarket's workflow catalog, a workflow's form and its conversation.

The whole integration is three files:

| File | What it shows |
| --- | --- |
| [`server/mint-session.js`](server/mint-session.js) | The server-side API call that mints the session |
| [`src/App.jsx`](src/App.jsx) | Passing the session to the SDK and switching between its components |
| [`vite.config.js`](vite.config.js) | The two server routes this example needs. In your app, your backend serves them |

## 1. Get an API key

A tenant admin creates the key in Outmarket:

1. Go to **Settings → API keys** and create a key.
2. **Permissions:** choose the `auth` scope (user sign-in). Full access (`*`) also works, but give the
   key only what it needs.
3. **Allowed IP addresses:** enter your servers' static egress IPs, so the key only works from your
   servers.
4. Copy the key and keep it in your server's secret store.

The key can sign in as any eligible member of your tenant. Keep it on your server: never send it to a
browser, commit it, or put it in a `VITE_*` or `NEXT_PUBLIC_*` variable.

## 2. Mint a session (server side)

When a user signs in to your app, your backend asks Outmarket for that user's session:

```bash
curl -X POST https://gateway.outmarket.ai/api/v1/auth/sessions \
  -H "Authorization: Bearer $OUTMARKET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com"}'
```

- `email` is your signed-in user. Take it from your own server-side records (a verified address),
  never from the browser. The user must already be a member of your Outmarket tenant.
- Mint once per sign-in, not on every page load. The SDK refreshes the session itself.

A `201` response is the session:

```json
{
  "access_token": "…",
  "refresh_token": "…",
  "token_type": "bearer",
  "expires_in": 604800,
  "expires_at": 1790049600,
  "user": { "id": "…", "email": "jane@example.com", "name": "Jane Doe" },
  "instance": { "id": "…", "name": "Acme Brokerage", "url": "https://….supabase.co", "public_key": "…" }
}
```

Return it to your page in the response to a same-origin request, with `Cache-Control: no-store`. It
holds the user's tokens, so keep it out of URLs and logs.

Common refusals:

| Response | Meaning |
| --- | --- |
| `403` with reason `key_not_eligible` | The key is revoked or expired, or API access is off for your tenant |
| `403` with reason `user_not_eligible` | This user can't be signed in this way. The reason is never given |
| `403` with reason `browser_origin_not_allowed` | The call came from a browser. Call from your server |
| `403` `{"message": "Source IP not allowed for this API key"}` | Your server's IP isn't in the key's allowed IP addresses |

The [SDK README](https://www.npmjs.com/package/@outmarket-ai/react-sdk) lists every error.

## 3. Render the SDK

Pass the session to `<OutmarketProvider>` unchanged and put the SDK's components inside it:

```jsx
import { OutmarketProvider, OutmarketWorkflowsList } from '@outmarket-ai/react-sdk';
import '@outmarket-ai/react-sdk/styles.css';

<OutmarketProvider session={session}>
  <OutmarketWorkflowsList
    module="commercial_lines" // or personal_lines, benefits
    onSelectWorkflow={(workflowId) => {
      /* show <OutmarketWorkflowForm workflowId={workflowId} … /> */
    }}
  />
</OutmarketProvider>;
```

[`src/App.jsx`](src/App.jsx) goes from the catalog to a workflow's form and on to the conversation.

## Run this example

You need Node.js 20 or later, an API key from step 1, and the email of a member of your tenant.

```bash
git clone https://github.com/Outmarket-AI/react-sdk-example.git
cd react-sdk-example
cp .env.example .env   # then set OUTMARKET_API_KEY
npm install
```

Set `SIGNED_IN_USER_EMAIL` in [`server/mint-session.js`](server/mint-session.js) to a member of your
tenant. It stands in for the user signed in to your app. Then start the app:

```bash
npm run dev
```

Open http://localhost:5173. The key's allowed IP addresses apply, so run it from a machine whose IP
is on that list. The first load in development takes a little while.

### Calling Outmarket from the browser

The SDK calls Outmarket's APIs from the browser, and Outmarket only accepts those calls from origins
it has allow-listed. localhost isn't one, so this example forwards the SDK's calls through its own
dev server (`apiUrls` in `src/App.jsx` and the proxy in `vite.config.js`). For your production site,
ask your Outmarket representative to allow-list your domain (for example `https://app.example.com`);
approval takes 1–2 business days. Then drop `apiUrls`, or keep forwarding the calls through your
backend.

## Notes

- The SDK needs React 19.
- The SDK is proprietary. Using it requires Outmarket's approval: see its license on
  [npm](https://www.npmjs.com/package/@outmarket-ai/react-sdk).
- For `onReady`, signing out and the other options, see the
  [SDK README](https://www.npmjs.com/package/@outmarket-ai/react-sdk).

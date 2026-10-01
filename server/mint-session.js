// Runs on the server only. This is the one call your backend makes when a user
// signs in to your app: it exchanges your Outmarket API key for that user's
// session. The API key never reaches the browser.

// The user signed in to your app. In your app, look this up on your server from
// the user's own session (a verified address), never from anything the browser
// sends. The user must be a member of your Outmarket tenant.
const SIGNED_IN_USER_EMAIL = 'jane@example.com';

export async function mintSession(env) {
  const apiKey = env.OUTMARKET_API_KEY;
  const gateway = env.OUTMARKET_GATEWAY_URL || 'https://gateway.outmarket.ai';

  if (!apiKey) {
    return { status: 500, body: { message: 'Set OUTMARKET_API_KEY in .env' } };
  }

  const response = await fetch(`${gateway}/api/v1/auth/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: SIGNED_IN_USER_EMAIL }),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { message: text };
  }
  return { status: response.status, body };
}

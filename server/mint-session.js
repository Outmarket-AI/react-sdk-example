// Runs on the server only. This is the one call your backend makes when a user
// signs in to your app: it exchanges your Outmarket API key for that user's
// session. The API key never reaches the browser.

export async function mintSession(env) {
  const apiKey = env.OUTMARKET_API_KEY;
  const email = env.OUTMARKET_USER_EMAIL;
  const gateway = env.OUTMARKET_GATEWAY_URL || 'https://gateway.outmarket.ai';

  if (!apiKey || !email) {
    return { status: 500, body: { message: 'Set OUTMARKET_API_KEY and OUTMARKET_USER_EMAIL in .env' } };
  }

  const response = await fetch(`${gateway}/api/v1/auth/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    // In your app, use the signed-in user's verified email from your own records,
    // never one the browser sends you.
    body: JSON.stringify({ email }),
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

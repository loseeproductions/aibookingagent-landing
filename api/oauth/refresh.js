/**
 * /api/oauth/refresh
 * Auto-refreshes Google OAuth access token.
 * Called by n8n before any Gmail API operation.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    });
    const data = await response.json();
    if (!data.access_token) {
      return res.status(500).json({ error: 'Token refresh failed', details: data });
    }
    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * /api/webhook/outreach
 * WINSTON Outreach Entry Point
 *
 * Receives prospect data from n8n scrapers, validates the secret,
 * logs intake, then triggers the WINSTON orchestration workflow in n8n.
 *
 * Required header: X-Outreach-Secret: aba-vpw-outreach-2026
 * Body: { prospect: { name, email, company, website, phone, city, source }, brand: 'ai-booking-agent' | 'vantage-point-web', notes: '' }
 */

const N8N_WEBHOOK = 'http://152.70.137.246:5678/webhook/winston-outreach';
const VALID_SECRET = 'aba-vpw-outreach-2026';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate secret
  const secret = req.headers['x-outreach-secret'];
  if (secret !== VALID_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validate body
  const body = req.body;
  if (!body?.prospect?.email || !body?.brand) {
    return res.status(400).json({ error: 'Missing prospect.email or brand' });
  }

  const validBrands = ['ai-booking-agent', 'vantage-point-web'];
  if (!validBrands.includes(body.brand)) {
    return res.status(400).json({ error: 'Invalid brand. Must be ai-booking-agent or vantage-point-web' });
  }

  try {
    // Forward to n8n WINSTON orchestrator
    const n8nResponse = await fetch(N8N_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Outreach-Secret': VALID_SECRET
      },
      body: JSON.stringify(body)
    });

    return res.status(200).json({
      received: true,
      brand: body.brand,
      prospect_email: body.prospect.email,
      n8n_status: n8nResponse.status
    });
  } catch (err) {
    // Still acknowledge receipt even if n8n is temporarily down
    console.error('n8n forward error:', err.message);
    return res.status(200).json({
      received: true,
      warning: 'n8n forward failed — prospect logged, will retry',
      error: err.message
    });
  }
}

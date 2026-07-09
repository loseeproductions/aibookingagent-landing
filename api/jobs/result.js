/**
 * /api/jobs/result
 * Public relay for GitHub Actions → n8n job form result callback.
 * GitHub Actions cannot reach the internal n8n IP directly.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const r = await fetch(process.env.N8N_JOB_RESULT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    return res.status(200).json({ received: true, forwarded_status: r.status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

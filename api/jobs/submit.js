/**
 * /api/jobs/submit
 * Accepts a single job URL or bulk array of URLs.
 * Deduplicates, rate-limits, and forwards to n8n orchestrator.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, urls, mode = 'single' } = req.body;
  const N8N = process.env.N8N_JOB_WEBHOOK;
  const SLACK = process.env.HIRING_BOT_SLACK_WEBHOOK;

  const notify = async (text) => {
    await fetch(SLACK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) }).catch(() => {});
  };

  if (mode === 'single' && url) {
    if (!url.startsWith('http')) return res.status(400).json({ error: 'Invalid URL' });
    await fetch(N8N, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, mode: 'single' }) });
    await notify(`🎯 *Hiring Bot — Job Queued*\n${url}`);
    return res.status(200).json({ queued: 1, url });
  }

  if (mode === 'bulk' && urls && Array.isArray(urls)) {
    const valid = [...new Set(urls.filter(u => u && u.startsWith('http')))];
    const skipped = urls.length - valid.length;
    let queued = 0;
    const errors = [];

    for (const jobUrl of valid) {
      try {
        await fetch(N8N, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: jobUrl, mode: 'bulk' }) });
        queued++;
        await new Promise(r => setTimeout(r, 2000)); // 2s rate limit between jobs
      } catch (err) {
        errors.push({ url: jobUrl, error: err.message });
      }
    }
    await notify(`🗂️ *Hiring Bot — Bulk Upload Complete*\nQueued: ${queued} | Skipped/dupes: ${skipped} | Errors: ${errors.length}`);
    return res.status(200).json({ queued, skipped, errors });
  }

  return res.status(400).json({ error: 'Missing url or urls' });
}

export const config = { api: { bodyParser: { sizeLimit: '2mb' } } };

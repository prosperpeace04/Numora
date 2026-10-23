import { verifyAdmin } from './_lib/admin-auth.js';
import { sql } from './_lib/db.js';

// GET   /api/admin/config  -> public, returns all key/value pairs (the
//        live app calls this on load to apply admin-edited colors)
// PATCH /api/admin/config  -> admin only, body: { key, value }
export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT key, value FROM app_config`;
      const config = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return res.status(200).json(config);
    } catch (error) {
      console.error('admin/config GET error:', error);
      return res.status(500).json({ error: 'Failed to load config' });
    }
  }

  if (req.method === 'PATCH') {
    if (!verifyAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { key, value } = req.body || {};
    if (!key || typeof value !== 'string') {
      return res.status(400).json({ error: 'key and value (string) are required' });
    }

    try {
      await sql`
        UPDATE app_config SET value = ${value}, updated_at = now() WHERE key = ${key}
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('admin/config PATCH error:', error);
      return res.status(500).json({ error: 'Failed to update config' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

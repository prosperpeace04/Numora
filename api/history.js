import { verifyAuth } from './_lib/verify-auth.js';
import { sql } from './_lib/db.js';

// GET /api/history
// Returns the signed-in user's saved Number Lookups, newest first.
// (api/lookup.js has always saved these; nothing was reading them back
// until now, so the History screen was only a placeholder.)
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const lookups = await sql`
      SELECT input_value, root_number, label, created_at
      FROM number_lookups
      WHERE user_id = ${authUser.userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return res.status(200).json({ lookups });
  } catch (error) {
    console.error('history error:', error);
    return res.status(500).json({ error: 'Failed to load history' });
  }
}

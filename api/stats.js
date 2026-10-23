import { verifyAdmin } from './_lib/admin-auth.js';
import { sql } from './_lib/db.js';

// GET /api/admin/stats
// Header: X-Admin-Password
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const [totalUsersRow] = await sql`SELECT COUNT(*)::int AS count FROM users`;

    const [activeUsersRow] = await sql`
      SELECT COUNT(*)::int AS count FROM users
      WHERE last_active_at > now() - interval '7 days'
    `;

    const [totalLookupsRow] = await sql`SELECT COUNT(*)::int AS count FROM number_lookups`;

    // signups per day, last 14 days
    const signupsByDay = await sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM users
      WHERE created_at > now() - interval '14 days'
      GROUP BY day
      ORDER BY day
    `;

    // lookups per day, last 14 days (from the events log)
    const lookupsByDay = await sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM events
      WHERE event_type = 'lookup' AND created_at > now() - interval '14 days'
      GROUP BY day
      ORDER BY day
    `;

    return res.status(200).json({
      totalUsers: totalUsersRow.count,
      activeUsers: activeUsersRow.count,
      totalLookups: totalLookupsRow.count,
      signupsByDay,
      lookupsByDay,
    });
  } catch (error) {
    console.error('admin/stats error:', error);
    return res.status(500).json({ error: 'Failed to load stats' });
  }
}

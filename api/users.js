import { verifyAdmin } from './_lib/admin-auth.js';
import { sql } from './_lib/db.js';

// GET /api/users?filter=all|active|incomplete   -> list of people
// GET /api/users?id=<user id>                   -> one person's details
// Header: X-Admin-Password
//
// People come from Neon Auth's own table (neon_auth."user"), joined to our
// users table. "Incomplete" means an account exists but there is no profile
// row yet, which is what a person who got stuck during sign-up looks like.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!verifyAdmin(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, filter } = req.query || {};

  try {
    if (id) {
      if (!/^[0-9a-f-]{36}$/i.test(String(id))) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const rows = await sql`
        SELECT a.id, a.email, a."emailVerified" AS email_verified, a."createdAt" AS joined,
               p.username, p.full_name, p.birthdate, p.last_active_at,
               p.push_opt_in, p.numerology_system,
               (p.id IS NOT NULL) AS has_profile,
               (SELECT COUNT(*)::int FROM number_lookups l WHERE l.user_id = a.id) AS lookup_count
        FROM neon_auth."user" a
        LEFT JOIN users p ON p.id = a.id
        WHERE a.id = ${id}
      `;
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.status(200).json({ user: rows[0] });
    }

    let rows;
    if (filter === 'active') {
      rows = await sql`
        SELECT a.id, a.email, a."emailVerified" AS email_verified, a."createdAt" AS joined,
               p.username, p.full_name, p.last_active_at, (p.id IS NOT NULL) AS has_profile
        FROM neon_auth."user" a
        JOIN users p ON p.id = a.id
        WHERE p.last_active_at > now() - interval '7 days'
        ORDER BY p.last_active_at DESC
        LIMIT 200
      `;
    } else if (filter === 'incomplete') {
      rows = await sql`
        SELECT a.id, a.email, a."emailVerified" AS email_verified, a."createdAt" AS joined,
               NULL AS username, NULL AS full_name, NULL AS last_active_at, false AS has_profile
        FROM neon_auth."user" a
        WHERE NOT EXISTS (SELECT 1 FROM users p WHERE p.id = a.id)
        ORDER BY a."createdAt" DESC
        LIMIT 200
      `;
    } else {
      rows = await sql`
        SELECT a.id, a.email, a."emailVerified" AS email_verified, a."createdAt" AS joined,
               p.username, p.full_name, p.last_active_at, (p.id IS NOT NULL) AS has_profile
        FROM neon_auth."user" a
        LEFT JOIN users p ON p.id = a.id
        ORDER BY a."createdAt" DESC
        LIMIT 200
      `;
    }
    return res.status(200).json({ users: rows });
  } catch (error) {
    console.error('users error:', error);
    // The admin page shows this text, so a database problem is visible
    // instead of looking like an empty list.
    return res.status(500).json({ error: 'Could not read users: ' + String(error.message || error).slice(0, 200) });
  }
}

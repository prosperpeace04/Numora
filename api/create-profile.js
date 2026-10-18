import { verifyAuth } from './_lib/verify-auth.js';
import { sql } from './_lib/db.js';

// POST /api/create-profile
// Body: { username, fullName, birthdate }  (birthdate as "YYYY-MM-DD")
//
// Called right after a successful Neon Auth sign-up (see the TODO in
// numora-auth/src/auth-main.js). Neon Auth only stores email/password/name
// in its own neon_auth.user table — this endpoint creates the matching row
// in OUR users table (see numora-schema.sql) with the fields Neon Auth
// doesn't know about.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { username, fullName, birthdate } = req.body || {};

  if (!username || !birthdate) {
    return res.status(400).json({ error: 'username and birthdate are required' });
  }

  try {
    // ON CONFLICT so a retry (e.g. the user refreshing mid-flow) doesn't fail
    await sql`
      INSERT INTO users (id, username, full_name, birthdate)
      VALUES (${authUser.userId}, ${username}, ${fullName || null}, ${birthdate})
      ON CONFLICT (id) DO UPDATE
      SET username = EXCLUDED.username,
          full_name = EXCLUDED.full_name,
          birthdate = EXCLUDED.birthdate
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('create-profile error:', error);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
}

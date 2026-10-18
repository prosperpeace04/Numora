import { verifyAuth } from './_lib/verify-auth.js';
import { sql } from './_lib/db.js';
import { getFullProfile } from './_lib/calculations.js';

// GET /api/profile
// Returns the signed-in user's saved record (username, birthdate, etc.)
// plus their full calculated numerology profile — this is what the
// dashboard's Profile tab should call instead of using hardcoded numbers.
export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PATCH') {
    const { numerologySystem } = req.body || {};
    if (!['pythagorean', 'chaldean'].includes(numerologySystem)) {
      return res.status(400).json({ error: 'numerologySystem must be "pythagorean" or "chaldean"' });
    }
    try {
      await sql`UPDATE users SET numerology_system = ${numerologySystem} WHERE id = ${authUser.userId}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('profile PATCH error:', error);
      return res.status(500).json({ error: 'Failed to update system preference' });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rows = await sql`
      SELECT username, full_name, birthdate, profile_picture_url, numerology_system
      FROM users
      WHERE id = ${authUser.userId}
    `;

    if (rows.length === 0) {
      // Signed up via Neon Auth but create-profile was never called/finished
      return res.status(404).json({ error: 'Profile not found. Complete sign-up first.' });
    }

    const user = rows[0];
    const birthdate = new Date(user.birthdate);
    const system = user.numerology_system || 'pythagorean';
    const numbers = getFullProfile(birthdate, user.full_name, new Date(), system);

    // keep a lightweight record of app activity for the admin CMS
    await sql`UPDATE users SET last_active_at = now() WHERE id = ${authUser.userId}`;

    return res.status(200).json({
      username: user.username,
      fullName: user.full_name,
      birthdate: user.birthdate,
      profilePictureUrl: user.profile_picture_url,
      numerologySystem: system,
      numbers,
    });
  } catch (error) {
    console.error('profile GET error:', error);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
}

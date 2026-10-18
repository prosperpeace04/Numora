import { verifyAuth } from './_lib/verify-auth.js';
import { sql } from './_lib/db.js';
import { getRootNumber } from './_lib/calculations.js';

// POST /api/lookup
// Body: { value: string, label?: string }
// Powers the dashboard's Number Lookup tab: reduces any input (account
// number, NIN, plate number, mixed letters+digits) to its root number,
// and saves it to number_lookups so it shows up in History.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { value, label } = req.body || {};

  if (!value || !String(value).trim()) {
    return res.status(400).json({ error: 'value is required' });
  }

  const rootNumber = getRootNumber(value);

  try {
    await sql`
      INSERT INTO number_lookups (user_id, input_value, root_number, label)
      VALUES (${authUser.userId}, ${value}, ${rootNumber}, ${label || null})
    `;

    // log the event for the admin CMS's charts
    await sql`
      INSERT INTO events (user_id, event_type)
      VALUES (${authUser.userId}, 'lookup')
    `;

    return res.status(200).json({ rootNumber });
  } catch (error) {
    console.error('lookup error:', error);
    return res.status(500).json({ error: 'Failed to save lookup' });
  }
}

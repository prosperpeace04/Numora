import { sql } from '../_lib/db.js';
import { sendPushToUsers } from '../_lib/onesignal.js';

// GET /api/cron/monthly-notify
// Triggered by Vercel Cron on the 1st of each month (see vercel.json).
//
// Note on security: Vercel's cron config (vercel.json) only specifies a
// path and schedule, it has no built-in way to attach a custom auth header
// to the request it sends. This endpoint is protected instead by being
// idempotent — it only notifies users not already notified this month, so
// even a repeated or unauthorized hit does no harm beyond wasted compute.
// If stricter protection is wanted later, a shared secret could be added
// as a URL query param and checked here.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);

    const dueUsers = await sql`
      SELECT id FROM users
      WHERE push_opt_in = true
        AND (last_notified_month IS NULL OR last_notified_month < ${firstOfMonth.toISOString().slice(0, 10)})
    `;

    if (dueUsers.length === 0) {
      return res.status(200).json({ notified: 0 });
    }

    const userIds = dueUsers.map((u) => u.id);
    const monthName = firstOfMonth.toLocaleString('en-US', { month: 'long' });

    await sendPushToUsers(userIds, `Your ${monthName} calendar is ready. Open Numora to see it.`);

    await sql`
      UPDATE users SET last_notified_month = ${firstOfMonth.toISOString().slice(0, 10)}
      WHERE id = ANY(${userIds})
    `;

    return res.status(200).json({ notified: userIds.length });
  } catch (error) {
    console.error('monthly-notify error:', error);
    return res.status(500).json({ error: 'Failed to send notifications' });
  }
}

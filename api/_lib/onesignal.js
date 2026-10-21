// Verified against OneSignal's official API reference:
// https://documentation.onesignal.com/reference/create-notification

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

/**
 * Sends a push notification to specific users by their external_id
 * (which we set to our own users.id via OneSignal.login() client-side).
 * @param {string[]} userIds - up to 20,000 per request, per OneSignal's docs
 * @param {string} message
 */
export async function sendPushToUsers(userIds, message) {
  const res = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${ONESIGNAL_API_KEY}`,
    },
    body: JSON.stringify({
      app_id: ONESIGNAL_APP_ID,
      target_channel: 'push',
      include_aliases: { external_id: userIds },
      contents: { en: message },
      headings: { en: 'Numora' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneSignal send failed (${res.status}): ${text}`);
  }

  return res.json();
}

import { verifyAuth } from './_lib/verify-auth.js';
import { sql } from './_lib/db.js';
import { presignBucketObject } from './_lib/neon-bucket.js';

// GET  /api/profile-picture  -> presigned URL to VIEW the current picture (or null)
// POST /api/profile-picture  -> body: { contentType }, returns a presigned URL to
//                                UPLOAD a new picture, and saves the object key
//
// Note: `users.profile_picture_url` actually stores the bucket OBJECT KEY, not
// a public URL — since display access goes through a short-lived presigned
// download URL (generated fresh on every GET here), not a fixed public link.
export default async function handler(req, res) {
  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT profile_picture_url FROM users WHERE id = ${authUser.userId}`;
      const objectKey = rows[0]?.profile_picture_url;

      if (!objectKey) {
        return res.status(200).json({ url: null });
      }

      const presigned = await presignBucketObject(objectKey, 'download');
      return res.status(200).json({ url: presigned.url });
    } catch (error) {
      console.error('profile-picture GET error:', error);
      return res.status(500).json({ error: 'Failed to get picture URL' });
    }
  }

  if (req.method === 'POST') {
    const { contentType } = req.body || {};
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'A valid image contentType is required' });
    }

    const extension = contentType.split('/')[1] || 'jpg';
    const objectKey = `${authUser.userId}/profile.${extension}`;

    try {
      const presigned = await presignBucketObject(objectKey, 'upload', contentType);

      await sql`UPDATE users SET profile_picture_url = ${objectKey} WHERE id = ${authUser.userId}`;

      return res.status(200).json({
        uploadUrl: presigned.url,
        method: presigned.method,
        headers: presigned.headers,
      });
    } catch (error) {
      console.error('profile-picture POST error:', error);
      return res.status(500).json({ error: 'Failed to get upload URL' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

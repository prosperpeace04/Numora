// Verified against Neon's official API reference:
// https://neon.com/docs/reference/api/buckets/presign-project-branch-bucket-object
//
// Requires a Neon account API key (NEON_API_KEY) — different from
// DATABASE_URL and NEON_AUTH_BASE_URL. Generate one in the Neon console
// under Account Settings > API Keys.

const PROJECT_ID = process.env.NEON_PROJECT_ID;
const BRANCH_ID = process.env.NEON_BRANCH_ID;
const BUCKET_NAME = process.env.NEON_BUCKET_NAME || 'numora-profile-pictures';
const API_KEY = process.env.NEON_API_KEY;

/**
 * @param {string} objectKey
 * @param {'upload'|'download'} operation
 * @param {string} [contentType] - only used/required for 'upload'
 * @returns {Promise<{url: string, method: string, headers: object, expiresAt: string}>}
 */
export async function presignBucketObject(objectKey, operation, contentType) {
  const encodedKey = encodeURIComponent(objectKey); // "/" in keys must be percent-encoded, per docs
  const url = `https://console.neon.tech/api/v2/projects/${PROJECT_ID}/branches/${BRANCH_ID}/buckets/${BUCKET_NAME}/objects/${encodedKey}/presign`;

  const body = { operation };
  if (operation === 'upload' && contentType) {
    body.content_type = contentType;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neon bucket presign failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return {
    url: data.url,
    method: data.method,
    headers: data.headers,
    expiresAt: data.expires_at,
  };
}

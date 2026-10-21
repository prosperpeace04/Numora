// Simple, deliberate design for a single-admin internal tool: the admin
// page sends the password itself as a header on every admin API request
// (over HTTPS), and this checks it against the ADMIN_PASSWORD env var each
// time. No sessions, no tokens, nothing to expire or rotate. Reasonable
// for one admin; would need a real auth scheme if more admins are added.
export function verifyAdmin(req) {
  const provided = req.headers['x-admin-password'];
  const real = process.env.ADMIN_PASSWORD;
  return Boolean(real) && provided === real;
}

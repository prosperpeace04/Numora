// Verified against Neon's documented JWT verification pattern:
// https://neon.com/docs/auth/guides/plugins/jwt
//
// The frontend gets a short-lived JWT via authClient.token() and sends it
// as "Authorization: Bearer <token>" on every API request. This function
// verifies that token's signature against Neon Auth's public JWKS endpoint
// before trusting anything in it.

import { jwtVerify, createRemoteJWKSet } from 'jose';

const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL;
const JWKS_URL = `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`;
const JWKS = createRemoteJWKSet(new URL(JWKS_URL));

/**
 * Verifies the request's Bearer token.
 * @returns {Promise<{userId: string, email: string, name: string} | null>}
 *   null if the token is missing, malformed, or invalid.
 */
export async function verifyAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: new URL(NEON_AUTH_BASE_URL).origin,
    });

    // payload.sub / payload.id is the Neon Auth user ID — see the documented
    // decoded JWT payload shape (id, sub, email, name, exp, iss, aud).
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
    };
  } catch (error) {
    console.error('Token validation failed:', error);
    return null;
  }
}

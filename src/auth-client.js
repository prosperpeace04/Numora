// Verified against Neon's documented quickstart pattern:
// https://neon.com/docs/auth/quick-start/react
import { createAuthClient } from '@neondatabase/neon-js/auth';

export const auth = createAuthClient(import.meta.env.VITE_NEON_AUTH_URL);

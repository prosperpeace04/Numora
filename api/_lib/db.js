// Verified against Neon's documented serverless driver pattern:
// https://neon.com/docs/serverless/serverless-driver
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL);

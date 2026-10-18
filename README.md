# Numora Auth — Setup

This is a small Vite project whose only job is to bundle the real Neon Auth
SDK, since Neon doesn't publish a plain CDN `<script>` version.

## Setup

1. `npm install` (installs `@neondatabase/neon-js` and `vite`)
2. Copy `.env.example` to `.env`, fill in `VITE_NEON_AUTH_URL` (find it in the
   Neon console under Settings > Better Auth > Auth URL)
3. `npm run dev` to test locally, or `npm run build` to produce the `dist/`
   folder for deployment on Vercel

## What's done

- `auth.html` — a working sign-up / sign-in page with a Sign Up / Sign In
  toggle, plus a second step for entering the email OTP verification code
  (since "Verify at Sign-up" is turned on in the Neon console)
- Real calls to Neon Auth: `auth.signUp.email()`, `auth.signIn.email()`,
  `auth.emailOtp.verifyEmail()` — all verified against Neon's own
  documentation, nothing guessed

## Item #4 — now built: the backend API

The `api/` folder contains real Vercel serverless functions, deployed
automatically alongside this Vite app (Vercel detects `api/*.js` on its own,
no extra config needed):

- `api/_lib/verify-auth.js` — verifies the JWT on every request against
  Neon Auth's JWKS endpoint (pattern verified against Neon's own docs)
- `api/_lib/db.js` — Neon Postgres connection (`@neondatabase/serverless`)
- `api/_lib/calculations.js` — the same verified numerology math, ESM version
- `api/create-profile.js` — saves username/full name/birthdate to `users`
  after sign-up (closes the TODO that used to be here)
- `api/profile.js` — returns the signed-in user's saved data + calculated
  numbers; the dashboard's Profile tab now calls this instead of using
  hardcoded numbers
- `api/lookup.js` — calculates a root number for any input and saves it to
  `number_lookups` (History); the dashboard's Number Lookup tab now calls
  this for real instead of calculating client-side
- `api/compatibility.js` — compares two birthdates using the Compatibility
  logic (no UI built for this yet, endpoint is ready for when it is)

### Additional setup needed before this works end-to-end

Add one more environment variable alongside `VITE_NEON_AUTH_URL`:

```
NEON_AUTH_BASE_URL=   # same value as VITE_NEON_AUTH_URL, used server-side
DATABASE_URL=         # your Neon Postgres connection string
```

## Calendar, Compatibility, Chaldean toggle, and Profile Pictures — now built

- **Calendar tab**: pulls your real birthdate from `/api/profile`, computes
  each day's Personal Day number client-side (verified to match the
  server's calculation exactly), tap a day for the full meaning, download
  as PNG.
- **Compatibility**: reachable via a link on the Profile tab (not a 6th nav
  tab), calls `/api/compatibility`.
- **Chaldean/Pythagorean toggle**: on the Account screen, saves via
  `PATCH /api/profile`, requires the extra migration below.
- **Profile picture upload**: on the Account screen, uses Neon Object
  Storage's presigned upload/download URLs (`api/profile-picture.js` +
  `api/_lib/neon-bucket.js`), verified against Neon's official API
  reference. Note: `users.profile_picture_url` stores the bucket OBJECT
  KEY, not a public link, display goes through a freshly presigned
  download URL on every load (safer, works regardless of bucket
  visibility settings).

### One more migration needed

Run `numora-migration-numerology-system.sql` (delivered separately) in
Neon's SQL Editor, it just adds the `numerology_system` column that the
toggle needs. Your original `users`/`number_lookups`/`events`/`app_config`
tables are unaffected.

### What's still not built

- Nothing is actually deployed to Vercel yet, this is all still local files

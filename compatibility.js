import { verifyAuth } from './_lib/verify-auth.js';
import { getCompatibility } from './_lib/calculations.js';

// POST /api/compatibility
// Body: { birthdateA: "YYYY-MM-DD", birthdateB: "YYYY-MM-DD", relationshipLabel?: string }
// Powers the Compatibility feature: compares any two people's Life Path
// numbers (not just romantic — e.g. "boyfriend", "father", "friend").
// No DB write needed here since this is a one-off calculation, not saved
// data, unless the user later asks for a saved-compatibility-history feature.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authUser = await verifyAuth(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { birthdateA, birthdateB, relationshipLabel } = req.body || {};

  if (!birthdateA || !birthdateB) {
    return res.status(400).json({ error: 'birthdateA and birthdateB are required' });
  }

  const result = getCompatibility(new Date(birthdateA), new Date(birthdateB));

  return res.status(200).json({
    ...result,
    relationshipLabel: relationshipLabel || null,
  });
}

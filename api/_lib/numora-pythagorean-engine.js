/**
 * Numora Pythagorean Calculation Engine
 *
 * Source basis: Numerology Name Calculator Handbook (2020), supplied by the user.
 * Implements only calculation methods documented in that handbook:
 *   - Life Path (birth date digits)
 *   - Destiny / Expression (full birth-certificate name)
 *   - Soul / Soul Urge / Heart's Desire (vowels in birth name)
 *   - Personality (consonants in birth name)
 *   - Birthday Root Number (day of month reduced to 1–9)
 *
 * Important: This module calculates numbers and returns transparent steps. It does
 * not claim numerology is scientifically validated. Calendar-cycle readings,
 * Pinnacles, Challenges, compatibility, and Chaldean calculations are deliberately
 * not implemented because this handbook does not define their formulas.
 */

export const PYTHAGOREAN_LETTER_VALUES = Object.freeze({
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8
});

export const MASTER_NUMBERS = Object.freeze([11, 22, 33]);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

function assertValidDateParts(year, month, day) {
  if (![year, month, day].every(Number.isInteger)) {
    throw new TypeError('Birth year, month, and day must be integers.');
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (month < 1 || month > 12 || day < 1 || date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new RangeError('Please provide a valid calendar date.');
  }
}

function digitSum(value) {
  return String(Math.abs(value)).split('').reduce((sum, digit) => sum + Number(digit), 0);
}

/** Reduce a positive integer to a root number, preserving 11, 22, and 33. */
export function reduceNumber(input, { preserveMasterNumbers = true } = {}) {
  if (!Number.isInteger(input) || input < 0) {
    throw new TypeError('Number to reduce must be a non-negative integer.');
  }
  const steps = [];
  let current = input;
  while (current > 9) {
    if (preserveMasterNumbers && MASTER_NUMBERS.includes(current)) {
      return { value: current, root: digitSum(current), isMasterNumber: true, steps };
    }
    const next = digitSum(current);
    steps.push({ from: current, expression: String(current).split('').join(' + '), result: next });
    current = next;
  }
  return { value: current, root: current, isMasterNumber: false, steps };
}

function normalizeName(fullName) {
  if (typeof fullName !== 'string' || !fullName.trim()) {
    throw new TypeError('Please provide a non-empty full birth name.');
  }
  // Normalize common accented Latin characters; retain only A–Z for the chart.
  return fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z\s'-]/g, '').trim().replace(/\s+/g, ' ');
}

function nameLetterDetails(fullName, kind, { yAsVowel = false } = {}) {
  const normalized = normalizeName(fullName);
  const letters = normalized.match(/[A-Z]/g) || [];
  const included = letters.filter(letter => {
    const isVowel = VOWELS.has(letter) || (letter === 'Y' && yAsVowel);
    return kind === 'all' || (kind === 'vowels' && isVowel) || (kind === 'consonants' && !isVowel);
  });
  const details = included.map(letter => ({ letter, value: PYTHAGOREAN_LETTER_VALUES[letter] }));
  return { normalized, details, total: details.reduce((sum, item) => sum + item.value, 0) };
}

function sumExpression(details) {
  if (!details.length) return '0';
  return details.map(item => `${item.letter}(${item.value})`).join(' + ');
}

/**
 * Life Path: add every digit in YYYY-MM-DD, then reduce while preserving 11/22/33.
 * The displayed date is kept in the user's conventional day/month/year style only
 * if the caller formats it; the engine accepts numeric year/month/day parts.
 */
export function calculateLifePath({ year, month, day }) {
  assertValidDateParts(year, month, day);
  const dateDigits = `${String(year).padStart(4, '0')}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`
    .split('').map(Number);
  const total = dateDigits.reduce((sum, digit) => sum + digit, 0);
  const reduction = reduceNumber(total);
  return {
    type: 'lifePath', label: 'Life Path Number', system: 'pythagorean',
    input: { year, month, day },
    calculation: {
      expression: dateDigits.join(' + '), total,
      reductionSteps: reduction.steps,
      finalExpression: reduction.steps.length ? reduction.steps.map(s => `${s.expression} = ${s.result}`).join('; ') : null
    },
    number: reduction.value, rootNumber: reduction.root,
    isMasterNumber: reduction.isMasterNumber
  };
}

/** Birthday Root Number: reduce only the day of the month to 1–9, per the handbook. */
export function calculateBirthdayRoot({ year, month, day }) {
  assertValidDateParts(year, month, day);
  const reduction = reduceNumber(day, { preserveMasterNumbers: false });
  return {
    type: 'birthdayRoot', label: 'Birthday / Root Number', system: 'pythagorean',
    input: { year, month, day },
    calculation: { expression: String(day).split('').join(' + '), total: day, reductionSteps: reduction.steps },
    number: reduction.value, rootNumber: reduction.value, isMasterNumber: false
  };
}

/**
 * Name calculation. The handbook's Destiny example reduces each name-part total,
 * then adds the reduced parts and reduces the final total. This option follows that
 * documented example. A master number is preserved when a reduction lands on 11/22/33.
 */
function calculateNameNumber(fullName, kind, label, options = {}) {
  const normalized = normalizeName(fullName);
  const nameParts = normalized.split(/[\s'-]+/).filter(Boolean);
  const parts = nameParts.map(part => {
    const filtered = nameLetterDetails(part, kind, options);
    return {
      namePart: part,
      letters: filtered.details,
      expression: sumExpression(filtered.details),
      total: filtered.total
    };
  });
  // The handbook's examples add the relevant letter values across the full name,
  // then reduce the combined total. This preserves Soul Number 22 in its Tesla example.
  const combinedTotal = parts.reduce((sum, part) => sum + part.total, 0);
  const finalReduction = reduceNumber(combinedTotal);
  return {
    type: kind === 'all' ? 'destinyExpression' : kind === 'vowels' ? 'soulUrge' : 'personality',
    label, system: 'pythagorean', input: { fullName: normalized, yAsVowel: Boolean(options.yAsVowel) },
    calculation: {
      parts,
      combinedExpression: parts.map(part => `(${part.total})`).join(' + '),
      combinedTotal,
      reductionSteps: finalReduction.steps
    },
    number: finalReduction.value, rootNumber: finalReduction.root,
    isMasterNumber: finalReduction.isMasterNumber
  };
}

export function calculateDestinyNumber(fullBirthName) {
  return calculateNameNumber(fullBirthName, 'all', 'Destiny / Expression Number');
}

export function calculateSoulUrgeNumber(fullBirthName, options = {}) {
  return calculateNameNumber(fullBirthName, 'vowels', 'Soul / Soul Urge Number', options);
}

export function calculatePersonalityNumber(fullBirthName, options = {}) {
  return calculateNameNumber(fullBirthName, 'consonants', 'Personality Number', options);
}

/** Convenience bundle for the calculations supported by this handbook. */
export function calculatePythagoreanProfile({ birthDate, fullBirthName, yAsVowel = false }) {
  if (!birthDate) throw new TypeError('birthDate is required: { year, month, day }.');
  const results = {
    lifePath: calculateLifePath(birthDate),
    birthdayRoot: calculateBirthdayRoot(birthDate)
  };
  if (typeof fullBirthName === 'string' && fullBirthName.trim()) {
    results.destinyExpression = calculateDestinyNumber(fullBirthName);
    results.soulUrge = calculateSoulUrgeNumber(fullBirthName, { yAsVowel });
    results.personality = calculatePersonalityNumber(fullBirthName, { yAsVowel });
  }
  return {
    system: 'pythagorean',
    source: 'Numerology Name Calculator Handbook (2020), user-provided PDF',
    results,
    unsupportedInSource: [
      'Personal Year / Personal Month / Personal Day formulas',
      'Pinnacle and Challenge formulas and timing',
      'Compatibility scoring or relationship interpretation rules',
      'Arbitrary number / phone / matric / ID number interpretation rules',
      'Chaldean letter mapping and calculations'
    ],
    note: 'These are numerology calculations and symbolic interpretations, not scientifically validated predictions.'
  };
}

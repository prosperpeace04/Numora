/**
 * Numora — Core Numerology Calculation Functions
 * All functions are pure (no side effects) so they can run
 * on the frontend, in a Vercel serverless function, or in tests.
 */

// ---------- Helpers ----------

/**
 * Reduces a number to a single digit, UNLESS it hits a master number
 * (11, 22, 33) along the way — those are preserved and not reduced further.
 * This matches standard numerology practice for Life Path, Expression,
 * and Personality numbers.
 */
function reduceNumber(num) {
  const masterNumbers = [11, 22, 33];
  while (num > 9 && !masterNumbers.includes(num)) {
    num = String(num)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return num;
}

/**
 * Reduces fully to a single digit, with NO master number exception.
 * Used for things like root number lookups, Personal Day, Personal Month,
 * Personal Year — where tradition keeps these as plain single digits.
 */
function reduceToSingleDigit(num) {
  while (num > 9) {
    num = String(num)
      .split('')
      .reduce((sum, digit) => sum + parseInt(digit, 10), 0);
  }
  return num;
}

// Standard Pythagorean letter-to-number chart
const PYTHAGOREAN_VALUES = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

// Chaldean letter-to-number chart (older system, does not use 9)
const CHALDEAN_VALUES = {
  a: 1, i: 1, j: 1, q: 1, y: 2,
  b: 2, k: 2, r: 2,
  c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8,
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

/**
 * @param {string} char
 * @param {'pythagorean'|'chaldean'} system - defaults to Pythagorean
 */
function letterValue(char, system = 'pythagorean') {
  const table = system === 'chaldean' ? CHALDEAN_VALUES : PYTHAGOREAN_VALUES;
  return table[char.toLowerCase()] || 0;
}

function isVowel(char) {
  return VOWELS.has(char.toLowerCase());
}

/**
 * Determines whether a 'y' at a given position in a name should be
 * treated as a vowel. Rule: Y counts as a vowel when it is NOT
 * immediately adjacent (before or after, within the same word) to
 * another true vowel. e.g. "Mary" -> Y is a vowel (preceded by 'r',
 * end of word). "Yellow" -> Y is a consonant (followed by 'e').
 */
function isYActingAsVowel(word, index) {
  const char = word[index].toLowerCase();
  if (char !== 'y') return false;
  const prev = index > 0 ? word[index - 1].toLowerCase() : null;
  const next = index < word.length - 1 ? word[index + 1].toLowerCase() : null;
  const prevIsVowel = prev && isVowel(prev);
  const nextIsVowel = next && isVowel(next);
  return !prevIsVowel && !nextIsVowel;
}

/**
 * Splits a full name into words and returns an array of
 * { char, isVowel } for every letter, applying the Y-vowel rule
 * per word (so Y's neighbors are only checked within the same word).
 */
function classifyLetters(fullName) {
  const words = fullName.split(/\s+/).filter(Boolean);
  const result = [];
  for (const word of words) {
    const letters = word.replace(/[^a-zA-Z]/g, '');
    for (let i = 0; i < letters.length; i++) {
      const char = letters[i];
      const treatAsVowel = isVowel(char) || isYActingAsVowel(letters, i);
      result.push({ char, isVowel: treatAsVowel });
    }
  }
  return result;
}

// ---------- Birthdate-based numbers ----------

/**
 * @param {Date} birthdate
 * @returns {number} Life Path number (1-9, or 11/22/33)
 */
function getLifePathNumber(birthdate) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  const year = birthdate.getFullYear();

  const allDigits = `${day}${month}${year}`
    .split('')
    .reduce((sum, d) => sum + parseInt(d, 10), 0);

  return reduceNumber(allDigits);
}

/**
 * Birth Day number — just the day of the month, reduced.
 */
function getBirthDayNumber(birthdate) {
  return reduceNumber(birthdate.getDate());
}

/**
 * Attitude / Sun number — month + day only (no year).
 */
function getAttitudeNumber(birthdate) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  return reduceNumber(day + month);
}

// ---------- Name-based numbers (require full birth name) ----------

/**
 * Expression / Destiny number — every letter in the full name.
 * @param {string} fullName
 * @param {'pythagorean'|'chaldean'} system - defaults to Pythagorean
 */
function getExpressionNumber(fullName, system = 'pythagorean') {
  const letters = classifyLetters(fullName);
  const total = letters.reduce((sum, { char }) => sum + letterValue(char, system), 0);
  return reduceNumber(total);
}

/**
 * Soul Urge number — vowels only (Y counted as a vowel where the
 * isYActingAsVowel rule applies, e.g. "Mary" but not "Yellow").
 */
function getSoulUrgeNumber(fullName, system = 'pythagorean') {
  const letters = classifyLetters(fullName);
  const total = letters
    .filter((l) => l.isVowel)
    .reduce((sum, { char }) => sum + letterValue(char, system), 0);
  return reduceNumber(total);
}

/**
 * Personality number — consonants only (Y excluded here whenever
 * it was counted as a vowel for Soul Urge, per the same rule).
 */
function getPersonalityNumber(fullName, system = 'pythagorean') {
  const letters = classifyLetters(fullName);
  const total = letters
    .filter((l) => !l.isVowel)
    .reduce((sum, { char }) => sum + letterValue(char, system), 0);
  return reduceNumber(total);
}

/**
 * Maturity number — Life Path + Expression, reduced.
 * Requires both birthdate and full name.
 */
function getMaturityNumber(birthdate, fullName, system = 'pythagorean') {
  const lifePath = getLifePathNumber(birthdate);
  const expression = getExpressionNumber(fullName, system);
  return reduceNumber(lifePath + expression);
}

// ---------- Time-based numbers (shift every year/month/day) ----------

/**
 * Personal Year — birth month + birth day + current year, reduced.
 * Fully reduced (no master number exception), per standard practice.
 */
function getPersonalYear(birthdate, currentDate = new Date()) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  const year = currentDate.getFullYear();

  const total = `${day}${month}${year}`
    .split('')
    .reduce((sum, d) => sum + parseInt(d, 10), 0);

  return reduceToSingleDigit(total);
}

/**
 * Personal Month — Personal Year + current calendar month, reduced.
 */
function getPersonalMonth(birthdate, currentDate = new Date()) {
  const personalYear = getPersonalYear(birthdate, currentDate);
  const month = currentDate.getMonth() + 1;
  return reduceToSingleDigit(personalYear + month);
}

/**
 * Personal Day — Personal Month + a given day-of-month, reduced.
 * Pass any `day` (1-31) to get that day's number — this is what
 * powers the monthly calendar grid.
 */
function getPersonalDay(birthdate, day, currentDate = new Date()) {
  const personalMonth = getPersonalMonth(birthdate, currentDate);
  return reduceToSingleDigit(personalMonth + day);
}

// ---------- Pinnacles & Challenges ----------

/**
 * Returns the four Pinnacle numbers and the age each one starts at.
 * Age boundaries are based on the Life Path number (36 - lifePath = end of 1st pinnacle).
 */
function getPinnacles(birthdate) {
  const day = reduceToSingleDigit(birthdate.getDate());
  const month = reduceToSingleDigit(birthdate.getMonth() + 1);
  const year = reduceToSingleDigit(birthdate.getFullYear());
  const lifePath = getLifePathNumber(birthdate);

  const first = reduceNumber(month + day);
  const second = reduceNumber(day + year);
  const third = reduceNumber(first + second);
  const fourth = reduceNumber(month + year);

  const firstEnd = 36 - (lifePath > 9 ? reduceToSingleDigit(lifePath) : lifePath);

  return [
    { number: first, startAge: 0, endAge: firstEnd },
    { number: second, startAge: firstEnd + 1, endAge: firstEnd + 9 },
    { number: third, startAge: firstEnd + 10, endAge: firstEnd + 18 },
    { number: fourth, startAge: firstEnd + 19, endAge: null }, // null = rest of life
  ];
}

/**
 * Returns the four Challenge numbers (uses absolute difference, not sum).
 */
function getChallenges(birthdate) {
  const day = reduceToSingleDigit(birthdate.getDate());
  const month = reduceToSingleDigit(birthdate.getMonth() + 1);
  const year = reduceToSingleDigit(birthdate.getFullYear());

  const first = Math.abs(month - day);
  const second = Math.abs(day - year);
  const third = Math.abs(first - second);
  const fourth = Math.abs(month - year);

  return [first, second, third, fourth];
}

// ---------- Number Lookup tool (any arbitrary number/string) ----------

/**
 * For the "Number Lookup" dashboard feature — reduces any input
 * (account number, NIN, plate number, even mixed letters+digits)
 * down to a single root digit (1-9).
 */
function getRootNumber(input) {
  const chars = String(input).toLowerCase().split('');
  const total = chars.reduce((sum, char) => {
    if (/[0-9]/.test(char)) return sum + parseInt(char, 10);
    if (/[a-z]/.test(char)) return sum + letterValue(char);
    return sum;
  }, 0);
  return reduceToSingleDigit(total);
}

// ---------- Full profile, convenience wrapper ----------

/**
 * Returns the complete core profile for a user, given birthdate
 * and (optionally) full birth name.
 * @param {'pythagorean'|'chaldean'} system - defaults to Pythagorean
 */
function getFullProfile(birthdate, fullName = null, currentDate = new Date(), system = 'pythagorean') {
  const profile = {
    system,
    lifePath: getLifePathNumber(birthdate),
    birthDay: getBirthDayNumber(birthdate),
    attitude: getAttitudeNumber(birthdate),
    personalYear: getPersonalYear(birthdate, currentDate),
    personalMonth: getPersonalMonth(birthdate, currentDate),
    pinnacles: getPinnacles(birthdate),
    challenges: getChallenges(birthdate),
  };

  if (fullName) {
    profile.expression = getExpressionNumber(fullName, system);
    profile.soulUrge = getSoulUrgeNumber(fullName, system);
    profile.personality = getPersonalityNumber(fullName, system);
    profile.maturity = getMaturityNumber(birthdate, fullName, system);
  }

  return profile;
}

// ---------- Compatibility ----------

// Life Path numbers grouped by natural harmony (odd/even + thematic match)
const COMPATIBILITY_GROUPS = [
  [1, 5, 7],
  [2, 4, 8],
  [3, 6, 9],
];

function groupOf(num) {
  const single = num > 9 ? reduceToSingleDigit(num) : num;
  return COMPATIBILITY_GROUPS.findIndex((g) => g.includes(single));
}

/**
 * Compares two people's Life Path numbers and returns a simple
 * compatibility read: same group = harmonious, adjacent/other = neutral.
 * This is a basic grouping heuristic, not a precise percentage science.
 * @param {Date} birthdateA
 * @param {Date} birthdateB
 */
function getCompatibility(birthdateA, birthdateB) {
  const lifePathA = getLifePathNumber(birthdateA);
  const lifePathB = getLifePathNumber(birthdateB);
  const groupA = groupOf(lifePathA);
  const groupB = groupOf(lifePathB);

  let result;
  if (lifePathA === lifePathB) {
    result = 'strong-match'; // identical Life Path, deep natural understanding
  } else if (groupA === groupB) {
    result = 'harmonious'; // same compatibility group
  } else {
    result = 'neutral'; // different groups, no inherent clash or boost
  }

  return { lifePathA, lifePathB, result };
}

module.exports = {
  reduceNumber,
  reduceToSingleDigit,
  getLifePathNumber,
  getBirthDayNumber,
  getAttitudeNumber,
  getExpressionNumber,
  getSoulUrgeNumber,
  getPersonalityNumber,
  getMaturityNumber,
  getPersonalYear,
  getPersonalMonth,
  getPersonalDay,
  getPinnacles,
  getChallenges,
  getRootNumber,
  getFullProfile,
  getCompatibility,
};

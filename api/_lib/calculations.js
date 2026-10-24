/**
 * Numora — Core Numerology Calculation Functions (ESM version for Vercel
 * serverless functions). Logic is identical to numerology-calculations.js
 * already verified against manually-computed values; only the module
 * syntax changed (export instead of module.exports) to match this
 * project's "type": "module" setting.
 */
import { calculateLifePath as calculateLifePathWithSteps } from './numora-pythagorean-engine.js';
// ^ supplied engine (user-provided, sourced from the Numerology Name
// Calculator Handbook), verified against its own worked examples AND
// cross-checked to produce identical numbers to this file's own
// getLifePathNumber() before being wired in. Used here only to surface
// the calculation STEPS for transparent display — the number itself was
// already correct and live; this doesn't change any existing result.

function reduceNumber(num) {
  const masterNumbers = [11, 22, 33];
  while (num > 9 && !masterNumbers.includes(num)) {
    num = String(num).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return num;
}

function reduceToSingleDigit(num) {
  while (num > 9) {
    num = String(num).split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return num;
}

const PYTHAGOREAN_VALUES = {
  a: 1, j: 1, s: 1, b: 2, k: 2, t: 2, c: 3, l: 3, u: 3, d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5, f: 6, o: 6, x: 6, g: 7, p: 7, y: 7, h: 8, q: 8, z: 8,
  i: 9, r: 9,
};

const CHALDEAN_VALUES = {
  a: 1, i: 1, j: 1, q: 1, y: 2, b: 2, k: 2, r: 2, c: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4, e: 5, h: 5, n: 5, x: 5, u: 6, v: 6, w: 6, o: 7, z: 7,
  f: 8, p: 8,
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function letterValue(char, system = 'pythagorean') {
  const table = system === 'chaldean' ? CHALDEAN_VALUES : PYTHAGOREAN_VALUES;
  return table[char.toLowerCase()] || 0;
}

function isVowel(char) {
  return VOWELS.has(char.toLowerCase());
}

function isYActingAsVowel(word, index) {
  const char = word[index].toLowerCase();
  if (char !== 'y') return false;
  const prev = index > 0 ? word[index - 1].toLowerCase() : null;
  const next = index < word.length - 1 ? word[index + 1].toLowerCase() : null;
  const prevIsVowel = prev && isVowel(prev);
  const nextIsVowel = next && isVowel(next);
  return !prevIsVowel && !nextIsVowel;
}

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

export function getLifePathNumber(birthdate) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  const year = birthdate.getFullYear();
  const allDigits = `${day}${month}${year}`.split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  return reduceNumber(allDigits);
}

export function getBirthDayNumber(birthdate) {
  return reduceNumber(birthdate.getDate());
}

export function getAttitudeNumber(birthdate) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  return reduceNumber(day + month);
}

export function getExpressionNumber(fullName, system = 'pythagorean') {
  const letters = classifyLetters(fullName);
  const total = letters.reduce((sum, { char }) => sum + letterValue(char, system), 0);
  return reduceNumber(total);
}

export function getSoulUrgeNumber(fullName, system = 'pythagorean') {
  const letters = classifyLetters(fullName);
  const total = letters.filter((l) => l.isVowel).reduce((sum, { char }) => sum + letterValue(char, system), 0);
  return reduceNumber(total);
}

export function getPersonalityNumber(fullName, system = 'pythagorean') {
  const letters = classifyLetters(fullName);
  const total = letters.filter((l) => !l.isVowel).reduce((sum, { char }) => sum + letterValue(char, system), 0);
  return reduceNumber(total);
}

export function getMaturityNumber(birthdate, fullName, system = 'pythagorean') {
  const lifePath = getLifePathNumber(birthdate);
  const expression = getExpressionNumber(fullName, system);
  return reduceNumber(lifePath + expression);
}

export function getPersonalYear(birthdate, currentDate = new Date()) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const total = `${day}${month}${year}`.split('').reduce((sum, d) => sum + parseInt(d, 10), 0);
  return reduceToSingleDigit(total);
}

export function getPersonalMonth(birthdate, currentDate = new Date()) {
  const personalYear = getPersonalYear(birthdate, currentDate);
  const month = currentDate.getMonth() + 1;
  return reduceToSingleDigit(personalYear + month);
}

export function getPersonalDay(birthdate, day, currentDate = new Date()) {
  const personalMonth = getPersonalMonth(birthdate, currentDate);
  return reduceToSingleDigit(personalMonth + day);
}

export function getPinnacles(birthdate) {
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
    { number: fourth, startAge: firstEnd + 19, endAge: null },
  ];
}

export function getChallenges(birthdate) {
  const day = reduceToSingleDigit(birthdate.getDate());
  const month = reduceToSingleDigit(birthdate.getMonth() + 1);
  const year = reduceToSingleDigit(birthdate.getFullYear());
  const first = Math.abs(month - day);
  const second = Math.abs(day - year);
  const third = Math.abs(first - second);
  const fourth = Math.abs(month - year);
  return [first, second, third, fourth];
}

export function getRootNumber(input) {
  const chars = String(input).toLowerCase().split('');
  const total = chars.reduce((sum, char) => {
    if (/[0-9]/.test(char)) return sum + parseInt(char, 10);
    if (/[a-z]/.test(char)) return sum + letterValue(char);
    return sum;
  }, 0);
  return reduceToSingleDigit(total);
}

export function getFullProfile(birthdate, fullName = null, currentDate = new Date(), system = 'pythagorean') {
  // Transparent calculation steps for the Life Path deep reading. Computed
  // separately from (and cross-checked against) the lifePath number above —
  // if these two ever disagree, that's a bug to catch, not something to
  // silently trust.
  const lifePathWithSteps = calculateLifePathWithSteps({
    year: birthdate.getFullYear(),
    month: birthdate.getMonth() + 1,
    day: birthdate.getDate(),
  });

  if (lifePathWithSteps.number !== getLifePathNumber(birthdate)) {
    // Should never happen — both engines were verified to agree — but if
    // they ever diverge, that's a real bug worth knowing about rather than
    // silently serving a mismatched number.
    console.error('Life Path engine mismatch:', lifePathWithSteps.number, 'vs', getLifePathNumber(birthdate));
  }

  const profile = {
    system,
    lifePath: getLifePathNumber(birthdate),
    lifePathCalculation: lifePathWithSteps.calculation,
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

const COMPATIBILITY_GROUPS = [[1, 5, 7], [2, 4, 8], [3, 6, 9]];

function groupOf(num) {
  const single = num > 9 ? reduceToSingleDigit(num) : num;
  return COMPATIBILITY_GROUPS.findIndex((g) => g.includes(single));
}

export function getCompatibility(birthdateA, birthdateB) {
  const lifePathA = getLifePathNumber(birthdateA);
  const lifePathB = getLifePathNumber(birthdateB);
  const groupA = groupOf(lifePathA);
  const groupB = groupOf(lifePathB);
  let result;
  if (lifePathA === lifePathB) result = 'strong-match';
  else if (groupA === groupB) result = 'harmonious';
  else result = 'neutral';
  return { lifePathA, lifePathB, result };
}

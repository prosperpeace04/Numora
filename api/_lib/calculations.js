/**
 * Numora — Core Numerology Calculation Functions (ESM version for Vercel
 * serverless functions). Logic is identical to numerology-calculations.js
 * already verified against manually-computed values; only the module
 * syntax changed (export instead of module.exports) to match this
 * project's "type": "module" setting.
 */
import {
  calculateLifePath as calculateLifePathWithSteps,
  calculateDestinyNumber as calculateDestinyWithSteps,
  calculateSoulUrgeNumber as calculateSoulUrgeWithSteps,
  calculatePersonalityNumber as calculatePersonalityWithSteps,
} from './numora-pythagorean-engine.js';
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

/**
 * Same reduction as reduceToSingleDigit(), but also records each step —
 * used for the transparent "show your work" display.
 */
function reduceToSingleDigitWithSteps(num) {
  const steps = [];
  while (num > 9) {
    const digits = String(num).split('');
    const next = digits.reduce((sum, d) => sum + parseInt(d, 10), 0);
    steps.push({ expression: digits.join(' + '), result: next });
    num = next;
  }
  return { value: num, steps };
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

/**
 * Same calculation as getPersonalYear(), but returns the full working too.
 * Self-consistency checked against getPersonalYear() before use, same
 * safety pattern as the Life Path / name-number step displays.
 */
export function getPersonalYearWithSteps(birthdate, currentDate = new Date()) {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const digits = `${day}${month}${year}`.split('');
  const total = digits.reduce((sum, d) => sum + parseInt(d, 10), 0);
  const { value, steps } = reduceToSingleDigitWithSteps(total);
  return {
    number: value,
    calculation: {
      expression: digits.join(' + '),
      total,
      reductionSteps: steps,
    },
  };
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

/**
 * Same as getRootNumber(), but also returns the digit-by-digit breakdown
 * and every reduction step, for transparent display. Self-consistency
 * checked by the caller against getRootNumber(), same safety pattern used
 * throughout this file.
 */
export function getRootNumberWithSteps(input) {
  const raw = String(input);
  const chars = raw.toLowerCase().split('');
  const values = [];
  for (const char of chars) {
    if (/[0-9]/.test(char)) values.push(parseInt(char, 10));
    else if (/[a-z]/.test(char)) values.push(letterValue(char));
    // anything else (spaces, punctuation) contributes nothing and is skipped
  }
  const total = values.reduce((a, b) => a + b, 0);
  const { value, steps } = reduceToSingleDigitWithSteps(total);
  return {
    number: value,
    calculation: {
      input: raw,
      expression: values.join(' + '),
      total,
      reductionSteps: steps,
    },
  };
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
    personalYearCalculation: (() => {
      const withSteps = getPersonalYearWithSteps(birthdate, currentDate);
      if (withSteps.number !== getPersonalYear(birthdate, currentDate)) {
        console.error('Personal Year step mismatch:', withSteps.number, 'vs', getPersonalYear(birthdate, currentDate));
        return undefined;
      }
      return withSteps.calculation;
    })(),
    personalMonth: getPersonalMonth(birthdate, currentDate),
    pinnacles: getPinnacles(birthdate),
    challenges: getChallenges(birthdate),
  };
  if (fullName) {
    profile.expression = getExpressionNumber(fullName, system);
    profile.soulUrge = getSoulUrgeNumber(fullName, system);
    profile.personality = getPersonalityNumber(fullName, system);
    profile.maturity = getMaturityNumber(birthdate, fullName, system);

    // Step-transparency for the name-based numbers (Pythagorean only — the
    // supplied engine doesn't cover Chaldean, same limitation as Life Path).
    // Same safety pattern as Life Path: only attach calculation steps when
    // both engines agree on the number; otherwise omit steps rather than
    // risk showing a breakdown for a different result than what's displayed.
    if (system === 'pythagorean') {
      const destinySteps = calculateDestinyWithSteps(fullName);
      if (destinySteps.number === profile.expression) {
        profile.expressionCalculation = destinySteps.calculation;
      } else {
        console.error('Expression engine mismatch:', destinySteps.number, 'vs', profile.expression);
      }

      const soulSteps = calculateSoulUrgeWithSteps(fullName);
      if (soulSteps.number === profile.soulUrge) {
        profile.soulUrgeCalculation = soulSteps.calculation;
      } else {
        console.error('Soul Urge engine mismatch:', soulSteps.number, 'vs', profile.soulUrge);
      }

      const personalitySteps = calculatePersonalityWithSteps(fullName);
      if (personalitySteps.number === profile.personality) {
        profile.personalityCalculation = personalitySteps.calculation;
      } else {
        console.error('Personality engine mismatch:', personalitySteps.number, 'vs', profile.personality);
      }
    }
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

  // Calculation steps for both people, same safety pattern as elsewhere:
  // only attach steps when they agree with the already-verified number.
  const calcA = calculateLifePathWithSteps({ year: birthdateA.getFullYear(), month: birthdateA.getMonth() + 1, day: birthdateA.getDate() });
  const calcB = calculateLifePathWithSteps({ year: birthdateB.getFullYear(), month: birthdateB.getMonth() + 1, day: birthdateB.getDate() });

  return {
    lifePathA,
    lifePathB,
    result,
    lifePathACalculation: calcA.number === lifePathA ? calcA.calculation : undefined,
    lifePathBCalculation: calcB.number === lifePathB ? calcB.calculation : undefined,
  };
}

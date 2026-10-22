// Generators for German numbers, clock times, and plural endings.
import { shuffle } from './random';

const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf',
  'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

/** 0 to 1,000,000 as one German word: 47 → "siebenundvierzig", 2500 → "zweitausendfünfhundert". */
export function numberToGerman(n: number): string {
  if (n < 0 || n > 1_000_000 || !Number.isInteger(n)) throw new RangeError(`unsupported number ${n}`);
  if (n === 1_000_000) return 'eine Million';
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    // "eins" shortens to "ein" in front of tausend: einundzwanzigtausend, hunderteintausend.
    const head = thousands === 1 ? 'ein' : numberToGerman(thousands).replace(/eins$/, 'ein');
    return `${head}tausend${rest ? numberToGerman(rest) : ''}`;
  }
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ones = n % 10;
    const tens = TENS[Math.floor(n / 10)];
    return ones === 0 ? tens : `${ones === 1 ? 'ein' : ONES[ones]}und${tens}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  return `${hundreds === 1 ? 'ein' : ONES[hundreds]}hundert${rest ? numberToGerman(rest) : ''}`;
}

/** German digit grouping: 1250 → "1.250", 1000000 → "1.000.000". */
export const formatNumber = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/** Everyday spoken time (12-hour), minutes in steps of 5: 2:30 → "halb drei". */
export function timeInformal(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const next = (h % 12) + 1;
  const say = (x: number) => numberToGerman(x);
  switch (minute) {
    case 0:
      return `${h === 1 ? 'ein' : say(h)} Uhr`;
    case 15:
      return `Viertel nach ${say(h)}`;
    case 25:
      return `fünf vor halb ${say(next)}`;
    case 30:
      return `halb ${say(next)}`;
    case 35:
      return `fünf nach halb ${say(next)}`;
    case 45:
      return `Viertel vor ${say(next)}`;
    default:
      return minute < 30 ? `${say(minute)} nach ${say(h)}` : `${say(60 - minute)} vor ${say(next)}`;
  }
}

/** Official 24-hour time: 14:30 → "vierzehn Uhr dreißig". */
export function timeFormal(hour: number, minute: number): string {
  const h = hour === 1 ? 'ein' : numberToGerman(hour);
  return minute ? `${h} Uhr ${numberToGerman(minute)}` : `${h} Uhr`;
}

const UMLAUTS: Record<string, string> = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };

/** Umlauts the stem vowel: Vater → Väter, Haus → Häus, Apfel → Äpfel, Saal → Säl. */
export function umlaut(word: string): string {
  const suffix = word.match(/(er|el|en|e)$/)?.[0] ?? '';
  const stem = word.slice(0, word.length - suffix.length);
  const m = stem.match(/^(.*?)(aa|au|Au|[aouAOU])([^aouAOUäöü]*)$/);
  if (!m) return word;
  const vowel = m[2] === 'aa' ? 'ä' : m[2].length === 2 ? `${UMLAUTS[m[2][0]]}u` : UMLAUTS[m[2]];
  return m[1] + vowel + m[3] + suffix;
}

/** Plural forms a learner might wrongly guess, excluding the real one. */
/** Dictionary-style plural endings: "-e" (Tisch → Tische), "¨-er" (Haus → Häuser), "–" (no change). */
const ENDINGS: [label: string, apply: (singular: string) => string][] = [
  ['–', (s) => s],
  ['¨', umlaut],
  ['-e', (s) => s + 'e'],
  ['¨-e', (s) => umlaut(s) + 'e'],
  ['-er', (s) => s + 'er'],
  ['¨-er', (s) => umlaut(s) + 'er'],
  ['-n', (s) => s + 'n'],
  ['-en', (s) => s + 'en'],
  ['¨-en', (s) => umlaut(s) + 'en'],
  ['-nen', (s) => s + 'nen'],
  ['-se', (s) => s + 'se'],
  ['-s', (s) => s + 's'],
];

/**
 * How a noun forms its plural, as a dictionary marks it: "-e", "¨-er", "–".
 * Irregular plurals show the swapped ending instead: Museum → Museen is "-um → -en".
 */
export function pluralEnding(singular: string, plural: string): string {
  const canUmlaut = umlaut(singular) !== singular;
  const hit = ENDINGS.find(([label, apply]) => (canUmlaut || !label.startsWith('¨')) && apply(singular) === plural);
  if (hit) return hit[0];
  let i = 0;
  while (singular[i] === plural[i]) i++;
  return `-${singular.slice(i)} → -${plural.slice(i)}`;
}

/** The right ending plus three wrong endings that suit the noun's shape. Never invents a word. */
export function pluralEndingOptions(singular: string, plural: string): string[] {
  const answer = pluralEnding(singular, plural);
  // Words with these endings never umlaut in the plural (Allergie → Allergien).
  const canUmlaut =
    umlaut(singular) !== singular && !/(ie|ei|ung|heit|keit|schaft|ion|tät|ik|ur|enz|anz|ment|um|in|chen|lein)$/.test(singular);
  const endsE = singular.endsWith('e');
  const endsElEr = /(el|er|en)$/.test(singular);
  const fits: Record<string, boolean> = {
    '–': true,
    '¨': canUmlaut,
    '-e': !endsE,
    '¨-e': canUmlaut && !endsE,
    '-er': !endsE && !endsElEr,
    '¨-er': canUmlaut && !endsE && !endsElEr,
    '-n': endsE || endsElEr,
    '-en': !endsE && !endsElEr,
    '-nen': singular.endsWith('in'),
    '-se': singular.endsWith('s'),
    '-s': true,
  };
  const wrong = shuffle(Object.keys(fits).filter((l) => fits[l] && l !== answer));
  // Short lists (Lampe: only "–" and "-s" fit) are topped up with other common endings.
  for (const extra of ['-e', '-en', '-er', '-n']) if (wrong.length < 3 && extra !== answer && !wrong.includes(extra)) wrong.push(extra);
  return [answer, ...wrong.slice(0, 3)];
}

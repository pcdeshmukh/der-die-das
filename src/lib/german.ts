// Generators for German numbers, clock times, and plausible wrong plurals.

const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf',
  'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

/** 0–999 as a German word: 47 → "siebenundvierzig". */
export function numberToGerman(n: number): string {
  if (n < 0 || n > 999 || !Number.isInteger(n)) throw new RangeError(`unsupported number ${n}`);
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

/** Umlauts the stem vowel: Vater → Väter, Haus → Häus, Apfel → Äpfel. */
export function umlaut(word: string): string {
  const suffix = word.match(/(er|el|en|e)$/)?.[0] ?? '';
  const stem = word.slice(0, word.length - suffix.length);
  const m = stem.match(/^(.*?)(au|Au|[aouAOU])([^aouAOUäöü]*)$/);
  if (!m) return word;
  const vowel = m[2].length === 2 ? `${UMLAUTS[m[2][0]]}u` : UMLAUTS[m[2]];
  return m[1] + vowel + m[3] + suffix;
}

/** Plural forms a learner might wrongly guess, excluding the real one. */
export function pluralDistractors(singular: string, plural: string): string[] {
  const endsE = singular.endsWith('e');
  const endsElEr = /(el|er|en)$/.test(singular);
  const u = umlaut(singular);
  const candidates = [
    singular,
    !endsE && singular + 'e',
    !endsE && !endsElEr && singular + 'en',
    (endsE || endsElEr) && singular + 'n',
    !endsE && !endsElEr && singular + 'er',
    singular + 's',
    u !== singular && u,
    u !== singular && !endsE && u + 'e',
    u !== singular && !endsE && !endsElEr && u + 'er',
  ];
  const result = [...new Set(candidates.filter((c): c is string => !!c && c !== plural))];
  // Short words like "Tee" get few rule-based candidates; top up with other endings.
  for (const extra of [singular + 'en', singular + 'er', singular + 'e']) {
    if (result.length >= 3) break;
    if (extra !== plural && !result.includes(extra)) result.push(extra);
  }
  return result;
}

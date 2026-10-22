import { describe, expect, it } from 'vitest';
import { formatNumber, numberToGerman, pluralDistractors, timeFormal, timeInformal, umlaut } from './german';

describe('numberToGerman', () => {
  it.each([
    [0, 'null'],
    [1, 'eins'],
    [12, 'zwölf'],
    [16, 'sechzehn'],
    [17, 'siebzehn'],
    [20, 'zwanzig'],
    [21, 'einundzwanzig'],
    [30, 'dreißig'],
    [47, 'siebenundvierzig'],
    [99, 'neunundneunzig'],
    [100, 'einhundert'],
    [101, 'einhunderteins'],
    [234, 'zweihundertvierunddreißig'],
    [999, 'neunhundertneunundneunzig'],
  ])('%i → %s', (n, word) => expect(numberToGerman(n)).toBe(word));

  it.each([
    [1000, 'eintausend'],
    [1001, 'eintausendeins'],
    [2500, 'zweitausendfünfhundert'],
    [21000, 'einundzwanzigtausend'],
    [101000, 'einhunderteintausend'],
    [999999, 'neunhundertneunundneunzigtausendneunhundertneunundneunzig'],
    [1000000, 'eine Million'],
  ])('%i → %s', (n, word) => expect(numberToGerman(n)).toBe(word));

  it('rejects numbers out of range', () => {
    expect(() => numberToGerman(1_000_001)).toThrow();
  });

  it('groups digits the German way', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1250)).toBe('1.250');
    expect(formatNumber(1000000)).toBe('1.000.000');
  });
});

describe('timeInformal', () => {
  it.each([
    [1, 0, 'ein Uhr'],
    [3, 0, 'drei Uhr'],
    [2, 5, 'fünf nach zwei'],
    [2, 15, 'Viertel nach zwei'],
    [2, 25, 'fünf vor halb drei'],
    [2, 30, 'halb drei'],
    [2, 35, 'fünf nach halb drei'],
    [2, 45, 'Viertel vor drei'],
    [2, 50, 'zehn vor drei'],
    [12, 30, 'halb eins'],
    [14, 30, 'halb drei'],
    [0, 15, 'Viertel nach zwölf'],
  ])('%i:%i → %s', (h, m, text) => expect(timeInformal(h, m)).toBe(text));
});

describe('timeFormal', () => {
  it.each([
    [14, 30, 'vierzehn Uhr dreißig'],
    [1, 0, 'ein Uhr'],
    [0, 5, 'null Uhr fünf'],
    [21, 45, 'einundzwanzig Uhr fünfundvierzig'],
  ])('%i:%i → %s', (h, m, text) => expect(timeFormal(h, m)).toBe(text));
});

describe('plurals', () => {
  it.each([
    ['Vater', 'Väter'],
    ['Haus', 'Häus'],
    ['Apfel', 'Äpfel'],
    ['Mutter', 'Mütter'],
    ['Tisch', 'Tisch'],
  ])('umlaut(%s) → %s', (word, result) => expect(umlaut(word)).toBe(result));

  it('offers wrong but plausible plurals, never the right one', () => {
    const d = pluralDistractors('Tisch', 'Tische');
    expect(d).not.toContain('Tische');
    expect(d.length).toBeGreaterThanOrEqual(3);
    expect(d).toContain('Tischen');
  });

  it('does not umlaut words whose ending never takes one', () => {
    expect(pluralDistractors('Allergie', 'Allergien')).not.toContain('Ällergie');
    expect(pluralDistractors('Wohnung', 'Wohnungen').some((d) => /[äöü]/.test(d))).toBe(false);
  });

  it('never doubles a final e', () => {
    expect(pluralDistractors('Höhle', 'Höhlen').some((d) => d.includes('ee'))).toBe(false);
  });

  it('has at least three distractors for every noun', async () => {
    const { loadAllLevels, allWords } = await import('../data');
    const LEVELS = await loadAllLevels();
    for (const w of LEVELS.flatMap((l) => allWords(l)).filter((x) => x.plural)) {
      expect(pluralDistractors(w.de, w.plural!).length, w.de).toBeGreaterThanOrEqual(3);
    }
  });
});

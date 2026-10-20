import { describe, expect, it } from 'vitest';
import { numberToGerman, pluralDistractors, timeFormal, timeInformal, umlaut } from './german';

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

  it('rejects numbers out of range', () => {
    expect(() => numberToGerman(1000)).toThrow();
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

  it('has at least three distractors for every A1 noun', async () => {
    const { LEVELS, allWords } = await import('../data');
    for (const w of allWords(LEVELS[0]).filter((x) => x.plural)) {
      expect(pluralDistractors(w.de, w.plural!).length, w.de).toBeGreaterThanOrEqual(3);
    }
  });
});

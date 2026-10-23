import { describe, expect, it } from 'vitest';
import { loadAllLevels } from '../data';
import { challengeHref, challengeQuestions, compare, parseResult } from './challenge';

const LEVELS = await loadAllLevels();
const A2 = LEVELS.find((l) => l.id === 'A2')!;

/** What a player sees: each question's options and answer, in order. */
const snapshot = (qs: ReturnType<typeof challengeQuestions>) => qs?.map((q) => [q.key, q.options, q.answer]);

describe('challenge rounds', () => {
  it.each([
    ['cooking', 'articles'],
    ['health', 'plural'],
    ['verbs', 'conjugate'],
    ['verbs', 'preterite'],
    ['verbs', 'perfect'],
    ['g-weil', 'grammar'],
    ['p-tasks', 'phrases'],
    ['mixed', 'articles'],
    ['numbers', 'numbers'],
    ['numbers', 'time'],
  ])('%s/%s: the same seed gives the same questions', (topic, mode) => {
    const a = challengeQuestions(A2, topic, mode, 'abc123');
    // Ten, or the whole lesson when it's shorter (phrase sets have eight).
    expect(a!.length).toBe(topic === 'p-tasks' ? 8 : 10);
    expect(snapshot(challengeQuestions(A2, topic, mode, 'abc123'))).toEqual(snapshot(a));
    expect(snapshot(challengeQuestions(A2, topic, mode, 'zzz999'))).not.toEqual(snapshot(a));
  });

  it('is not offered for review, games with their own interaction, or unknown content', () => {
    expect(challengeQuestions(A2, 'review', 'articles', 'x')).toBeNull();
    expect(challengeQuestions(A2, 'cooking', 'match', 'x')).toBeNull();
    expect(challengeQuestions(A2, 'cooking', 'listen', 'x')).toBeNull();
    expect(challengeQuestions(A2, 'nope', 'articles', 'x')).toBeNull();
  });
});

describe('challenge links', () => {
  it('round-trips the challenger result', () => {
    const link = challengeHref(A2, 'g-weil', 'grammar', 'abc123', { name: 'Anna', correct: 9, total: 10, seconds: 48 });
    expect(link).toBe('#/challenge/a2/g-weil/grammar/abc123/Anna/9/10/48');
    expect(parseResult(['Anna', '9', '10', '48'])).toEqual({ name: 'Anna', correct: 9, total: 10, seconds: 48 });
  });

  it('keeps anonymous players anonymous and rejects broken tails', () => {
    expect(challengeHref(A2, 'x', 'grammar', 's', { name: ' ', correct: 1, total: 2, seconds: 3 })).toMatch(/\/~\/1\/2\/3$/);
    expect(parseResult(['~', '1', '2', '3'])?.name).toBe('');
    expect(parseResult([])).toBeNull();
    expect(parseResult(['Anna', '11', '10', '48'])).toBeNull();
    expect(parseResult(['Anna', 'x', '10', '48'])).toBeNull();
  });

  it('decides by score, then by time', () => {
    const r = (correct: number, seconds: number) => ({ name: '', correct, total: 10, seconds });
    expect(compare(r(9, 60), r(8, 30))).toBe('win');
    expect(compare(r(8, 30), r(8, 31))).toBe('win');
    expect(compare(r(8, 31), r(8, 30))).toBe('lose');
    expect(compare(r(8, 30), r(8, 30))).toBe('draw');
  });
});

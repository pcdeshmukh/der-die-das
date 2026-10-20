import { describe, expect, it } from 'vitest';
import { LEVELS } from '../data';
import { dailyQuestions } from './DailyGame';

const A1 = LEVELS[0];
const keys = (day: string) => dailyQuestions(A1, day).map((q) => q.key);

describe('dailyQuestions', () => {
  it('gives everyone the same twelve questions on a day', () => {
    expect(keys('2026-10-20')).toHaveLength(12);
    expect(keys('2026-10-20')).toEqual(keys('2026-10-20'));
  });

  it('changes from one day to the next', () => {
    expect(keys('2026-10-20')).not.toEqual(keys('2026-10-21'));
  });

  it('has no repeated questions and a valid answer for each', () => {
    for (const day of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const qs = dailyQuestions(A1, day);
      expect(new Set(qs.map((q) => q.key)).size).toBe(qs.length);
      for (const q of qs) {
        expect(q.options, q.key).toContain(q.answer);
        expect(new Set(q.options).size, q.key).toBe(q.options.length);
      }
    }
  });
});

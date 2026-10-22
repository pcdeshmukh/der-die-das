import { describe, expect, it } from 'vitest';
import { LEVELS, perfectItems, verbForms } from '../data';
import { conjugationQuestion } from './ConjugationGame';
import { perfectQuestion } from './PerfectGame';

describe.each(LEVELS.filter((l) => l.verbs?.verbs.length))('$id verb questions', (level) => {
  it.each(['present', 'preterite'] as const)('%s: every form has its answer among unique options', (tense) => {
    for (const form of verbForms(level, tense)) {
      const q = conjugationQuestion(level, form);
      expect(q.options, q.key).toContain(q.answer);
      expect(new Set(q.options).size, q.key).toBe(q.options.length);
      expect(q.options.length, q.key).toBeGreaterThanOrEqual(3);
    }
  });

  it('perfect: right helper verb and participle among unique options', () => {
    for (const item of perfectItems(level)) {
      for (let i = 0; i < 6; i++) {
        const q = perfectQuestion(level, item);
        expect(q.options, q.key).toContain(q.answer);
        expect(new Set(q.options).size, q.key).toBe(q.options.length);
        expect(q.options.length, q.key).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

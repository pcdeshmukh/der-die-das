import { describe, expect, it } from 'vitest';
import { loadAllLevels, perfectItems, verbForms } from '../data';
import { conjugationQuestion } from './ConjugationGame';
import { perfectQuestion } from './PerfectGame';

const LEVELS = await loadAllLevels();

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

describe('wrong forms', () => {
  const a2 = LEVELS.find((l) => l.id === 'A2')!;
  const perfectOptions = (infinitive: string) => {
    const item = perfectItems(a2).find((i) => i.verb.infinitive === infinitive)!;
    return perfectQuestion(a2, item).options.join(' ');
  };

  it('keeps a separable prefix in front of "ge"', () => {
    expect(perfectOptions('umziehen')).toMatch(/\bumgezieht\b/);
    expect(perfectOptions('einladen')).toMatch(/\beingeladet\b/);
  });

  it('adds -et after a d/t stem', () => expect(perfectOptions('arbeiten')).toMatch(/\bgearbeiten\b/));

  it('never offers Konjunktiv II as a Präteritum form', () => {
    for (const form of verbForms(a2, 'preterite').filter((f) => f.verb.infinitive === 'können')) {
      expect(conjugationQuestion(a2, form).options.some((o) => o.startsWith('könnte'))).toBe(false);
    }
  });
});

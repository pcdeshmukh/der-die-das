import { describe, expect, it } from 'vitest';
import type { Verb } from '../data/types';
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

describe.each(LEVELS.filter((l) => l.verbs?.verbs.length))('$id wrong forms', (level) => {
  const AUX = ['habe', 'hast', 'hat', 'haben', 'habt', 'bin', 'bist', 'ist', 'sind', 'seid'];
  // Every word in an option must be a real form of the verb (or haben/sein), never a made-up one.
  const real = (v: Verb) =>
    new Set([v.infinitive, ...v.present, ...(v.preterite ?? []), ...(v.perfect?.split(' ') ?? []), ...AUX].flatMap((f) => f.split(' ')));

  it.each(['present', 'preterite'] as const)('%s options are real forms of the verb', (tense) => {
    for (const form of verbForms(level, tense)) {
      const words = real(form.verb);
      for (const o of conjugationQuestion(level, form).options) for (const w of o.split(' ')) expect(words, `${form.id}: ${o}`).toContain(w);
    }
  });

  it('perfect options are real forms of the verb', () => {
    for (const item of perfectItems(level)) {
      const words = real(item.verb);
      for (const o of perfectQuestion(level, item).options) for (const w of o.split(' ')) expect(words, `${item.id}: ${o}`).toContain(w);
    }
  });
});

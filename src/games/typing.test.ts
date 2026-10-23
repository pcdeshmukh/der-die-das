import { describe, expect, it } from 'vitest';
import { allWords, grammarItems, loadAllLevels, perfectItems, verbForms } from '../data';
import { grade } from '../lib/typing';
import { articleQuestion } from './ArticleGame';
import type { ChoiceQuestion } from './ChoiceGame';
import { conjugationQuestion } from './ConjugationGame';
import { grammarQuestion } from './GrammarGame';
import { perfectQuestion } from './PerfectGame';
import { pluralQuestion } from './PluralGame';

const LEVELS = await loadAllLevels();

/** The answer a player would tap is also the one they can type. */
function expectTypeable(q: ChoiceQuestion, typedAnswer = q.answer) {
  expect(q.typed, q.key).toBeDefined();
  expect(q.typed!.accepted[0], q.key).toBe(typedAnswer);
  expect(grade(typedAnswer, q.typed!.accepted), q.key).toBe('exact');
}

describe.each(LEVELS)('$id typed answers', (level) => {
  it('nouns: article and noun, or the plural', () => {
    for (const w of allWords(level)) {
      expectTypeable(articleQuestion(w), `${w.article} ${w.de}`);
      if (w.plural) expectTypeable(pluralQuestion(w), w.plural);
    }
  });

  it('verbs: the form, or helper verb and participle', () => {
    for (const tense of ['present', 'preterite'] as const) {
      for (const f of level.verbs?.verbs.some((v) => v[tense]) ? verbForms(level, tense) : []) expectTypeable(conjugationQuestion(level, f));
    }
    for (const item of perfectItems(level)) expectTypeable(perfectQuestion(level, item));
  });

  it('grammar: gaps can be typed, with the choices as a hint', () => {
    for (const lesson of level.grammar) {
      for (const item of grammarItems(level, lesson)) {
        const q = grammarQuestion(item);
        if (!item.q.includes('___')) {
          expect(q.typed, q.key).toBeUndefined();
          continue;
        }
        expectTypeable(q);
        expect(q.typed!.hint, q.key).toBe(q.options.join(' · '));
      }
    }
  });
});

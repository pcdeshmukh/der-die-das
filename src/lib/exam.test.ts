import { describe, expect, it } from 'vitest';
import { loadLevel } from '../data';
import {
  MODULES,
  PASS_MARK,
  choicePages,
  countWords,
  hasClosing,
  hasGreeting,
  markedPoints,
  parseRun,
  predicate,
  scaled,
  speakingReport,
  speakingSteps,
  totalScore,
  writingReport,
} from './exam';

const A1 = await loadLevel('A1');

describe('scoring', () => {
  it('turns four full parts into 100 points', () => {
    expect(scaled(15)).toBe(25);
    expect(totalScore([15, 15, 15, 15])).toBe(100);
  });

  it('passes at 36 of 60 raw points, as in the exam', () => {
    expect(totalScore([9, 9, 9, 9])).toBe(PASS_MARK);
    expect(totalScore([9, 9, 9, 8])).toBeLessThan(PASS_MARK);
    expect(predicate(60)).toBe('ausreichend');
    expect(predicate(59)).toBe('nicht bestanden');
    expect(predicate(90)).toBe('sehr gut');
  });

  it('rounds self-marked points to whole points, halves up', () => {
    expect(markedPoints([{ max: 3, rating: 0.5 }, { max: 1, rating: 0 }])).toBe(2);
    expect(markedPoints([{ max: 2, rating: 1 }, { max: 1, rating: null }])).toBe(2);
  });
});

describe('routes', () => {
  it('reads a whole part as exam mode and one Teil as practice', () => {
    expect(parseRun('lesen')).toMatchObject({ module: { id: 'lesen' }, teile: [1, 2, 3], exam: true });
    expect(parseRun('schreiben')).toMatchObject({ teile: [1, 2], exam: true });
    expect(parseRun('hoeren-2')).toMatchObject({ module: { id: 'hoeren' }, teile: [2], exam: false });
    expect(parseRun('schreiben-3')).toBeNull();
    expect(parseRun('kochen')).toBeNull();
  });
});

describe.each(A1.exams.map((e) => [e.id, e] as const))('Modelltest %s', (_, exam) => {
  it.each(['hoeren', 'lesen'] as const)('numbers the 15 %s questions in order', (module) => {
    const items = choicePages(exam, module, [1, 2, 3]).flatMap((p) => p.items);
    expect(items.map((x) => x.n)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    for (const x of items) expect(x.options[x.answer], x.key).toBeTruthy();
    // Practising one Teil keeps the exam's numbers.
    expect(choicePages(exam, module, [2])[0].items[0].n).toBe(module === 'hoeren' ? 7 : 6);
  });

  it('plays Hören Teil 2 once and the others twice', () => {
    const plays = choicePages(exam, 'hoeren', [1, 2, 3]).map((p) => (p.stimulus.kind === 'audio' ? p.stimulus.plays : 0));
    expect(plays).toEqual([2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2]);
  });

  it('has speaking turns worth 3 + 6 + 6 points', () => {
    const steps = speakingSteps(exam, [1, 2, 3]);
    const teil = (n: number) => steps.filter((s) => s.teil === n).reduce((sum, s) => sum + s.max, 0);
    expect([teil(1), teil(2), teil(3)]).toEqual([3, 6, 6]);
    // The card a learner asks about is never the one they are asked about.
    for (const i of [0, 1]) {
      const ask = steps.find((s) => s.key === `ask-${i}`)!;
      const answer = steps.find((s) => s.key === `answer-${i}`)!;
      expect(ask.word).not.toBe(answer.word);
    }
  });

  it('writes reports a teacher can read', () => {
    const writing = writingReport(exam, {
      form: [{ label: 'Vorname', text: 'Maria', ok: true }],
      text: 'Liebe Frau Klein, ich bin krank.',
      selfMarked: 7.5,
    });
    expect(writing).toContain(`Modelltest ${exam.id} – Schreiben`);
    expect(writing).toContain(exam.schreiben.teil2.points[0].de);
    expect(writing).toContain('Mein Text (6 Wörter):');
    expect(writing).toContain('7,5 von 10');

    const steps = speakingSteps(exam, [1]);
    const speaking = speakingReport(exam, steps, { intro: 'Ich heiße Ana.' }, 2);
    expect(speaking).toContain('Teil 1 – Sich vorstellen');
    expect(speaking).toContain('Ich: Ich heiße Ana.');
    expect(speaking).toContain(`„${exam.sprechen.teil1.spell.q.de}“`);
    expect(speaking).toContain('2 von 3 Punkten');
  });
});

describe('message checks', () => {
  it('counts words and spots greeting and sign-off', () => {
    expect(countWords('Liebe Lena,\nvielen Dank – bis bald!')).toBe(6);
    expect(hasGreeting('Hallo Tom, wie geht’s?')).toBe(true);
    expect(hasGreeting('Ich komme morgen.')).toBe(false);
    expect(hasClosing('… Viele Grüße\nAna')).toBe(true);
    expect(hasClosing('… Viele Gruesse, Ana')).toBe(true);
    expect(hasClosing('Ich komme morgen.')).toBe(false);
  });

  it('has a model answer that passes its own checks', () => {
    for (const exam of A1.exams) {
      const model = exam.schreiben.teil2.model.de;
      expect(hasGreeting(model), exam.id).toBe(true);
      expect(hasClosing(model), exam.id).toBe(true);
      expect(countWords(model), exam.id).toBeGreaterThanOrEqual(25);
      expect(countWords(model), exam.id).toBeLessThanOrEqual(50);
    }
  });
});

it('lists the four parts in exam order', () => {
  expect(MODULES.map((m) => m.id)).toEqual(['hoeren', 'lesen', 'schreiben', 'sprechen']);
});

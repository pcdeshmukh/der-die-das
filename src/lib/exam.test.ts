import { describe, expect, it } from 'vitest';
import { loadLevel } from '../data';
import type { ExamSet } from '../data/types';
import {
  PASS_MARK,
  choicePages,
  countWords,
  groupPoints,
  hasClosing,
  hasGreeting,
  markedPoints,
  maxPoints,
  modulesOf,
  outcome,
  parseRun,
  predicate,
  scaled,
  speakingReport,
  speakingSteps,
  stepsMax,
  writingReport,
  writingTeile,
} from './exam';

const A1 = await loadLevel('A1');
const A2 = await loadLevel('A2');
const sd1 = A1.exams[0];
const a2 = A2.exams[0];

describe('scoring', () => {
  it('turns full marks into 100 points in both formats', () => {
    for (const exam of [sd1, a2]) {
      const modules = modulesOf(exam);
      expect(modules.map((m) => scaled(m, m.rawMax))).toEqual([25, 25, 25, 25]);
      expect(outcome(exam, modules.map((m) => m.rawMax))).toEqual({ total: 100, passed: true, short: undefined });
    }
  });

  it('passes Start Deutsch 1 at 36 of 60 raw points', () => {
    expect(outcome(sd1, [9, 9, 9, 9])).toMatchObject({ total: PASS_MARK, passed: true });
    expect(outcome(sd1, [9, 9, 9, 8]).passed).toBe(false);
  });

  it('needs 45 written and 15 spoken points for Goethe A2, besides 60 overall', () => {
    // Lesen, Hören, Schreiben raw out of 20 (×1.25), Sprechen out of 25.
    expect(outcome(a2, [12, 12, 12, 15])).toMatchObject({ total: 60, passed: true });
    expect(outcome(a2, [20, 20, 20, 10])).toMatchObject({ total: 85, passed: false, short: 'oral' });
    expect(outcome(a2, [10, 10, 15, 25])).toMatchObject({ total: 69, passed: false, short: 'written' });
  });

  it('names the grades as on the certificate', () => {
    expect(predicate(60)).toBe('ausreichend');
    expect(predicate(59)).toBe('nicht bestanden');
    expect(predicate(90)).toBe('sehr gut');
  });
});

describe('self-marking', () => {
  const [, message] = writingTeile(sd1);
  const a2Message = writingTeile(a2)[0];

  it('marks Start Deutsch 1 messages per point: 3 + 3 + 3 + 1', () => {
    if (message.kind !== 'message') throw new Error('Teil 2 is a message');
    expect(maxPoints(message.criteria)).toBe(10);
    expect(groupPoints(message.criteria, [0, 1, 0, 1])).toBe(3 + 1.5 + 3 + 0.5);
  });

  it('marks Goethe A2 messages A to E, and a task not done scores nothing', () => {
    if (a2Message.kind !== 'message') throw new Error('Teil 1 is a message');
    expect(maxPoints(a2Message.criteria)).toBe(10);
    expect(groupPoints(a2Message.criteria, [1, 0])).toBe(3.5 + 5);
    expect(groupPoints(a2Message.criteria, [4, 0])).toBe(0);
    expect(groupPoints(a2Message.criteria, [0, null])).toBe(5);
  });
});

describe('routes', () => {
  it('reads a whole part as exam mode and one Teil as practice', () => {
    expect(parseRun(sd1, 'lesen')).toMatchObject({ module: { id: 'lesen' }, teile: [1, 2, 3], exam: true });
    expect(parseRun(a2, 'lesen')).toMatchObject({ teile: [1, 2, 3, 4], exam: true });
    expect(parseRun(sd1, 'hoeren-2')).toMatchObject({ module: { id: 'hoeren' }, teile: [2], exam: false });
    expect(parseRun(sd1, 'lesen-4')).toBeNull();
    expect(parseRun(a2, 'lesen-4')).toMatchObject({ teile: [4] });
    expect(parseRun(a2, 'kochen')).toBeNull();
  });
});

const ALL: [string, ExamSet][] = [...A1.exams, ...A2.exams].map((e) => [`${e.format} ${e.id}`, e]);

describe.each(ALL)('Modelltest %s', (_, exam) => {
  const modules = modulesOf(exam);
  const count = (id: string) => modules.find((m) => m.id === id)!.rawMax;

  it.each(['hoeren', 'lesen'] as const)('numbers the %s questions in order', (module) => {
    const items = choicePages(exam, module, [1, 2, 3, 4]).flatMap((p) => p.items);
    expect(items.map((x) => x.n)).toEqual(Array.from({ length: count(module) }, (_, i) => i + 1));
    for (const x of items) expect(x.options[x.answer], x.key).toBeTruthy();
    // Practising one Teil keeps the exam's numbers.
    const second = choicePages(exam, module, [2])[0].items[0].n;
    expect(second).toBe(items.find((x) => x.teil === 2)!.n);
  });

  it('plays the recordings as often as the exam does', () => {
    const plays = choicePages(exam, 'hoeren', [1, 2, 3, 4]).map((p) => [p.teil, p.stimulus.kind === 'audio' ? p.stimulus.plays : 0]);
    const byTeil = Object.fromEntries(plays);
    expect(byTeil).toEqual(exam.format === 'sd1' ? { 1: 2, 2: 1, 3: 2 } : { 1: 2, 2: 1, 3: 1, 4: 2 });
  });

  it('has speaking worth as much as the exam', () => {
    const steps = speakingSteps(exam, [1, 2, 3], true);
    expect(stepsMax(steps)).toBe(count('sprechen'));
    const teil = (n: number) => stepsMax(steps.filter((s) => s.teil === n && s.key !== 'mark-pronunciation'));
    expect([teil(1), teil(2), teil(3)]).toEqual(exam.format === 'sd1' ? [3, 6, 6] : [4, 9, 8]);
  });

  it('has writing worth as much as the exam', () => {
    const max = writingTeile(exam).reduce((sum, t) => sum + (t.kind === 'form' ? t.fields.filter((f) => f.value === undefined).length : maxPoints(t.criteria)), 0);
    expect(max).toBe(count('schreiben'));
  });

  it('writes reports a teacher can read', () => {
    const messages = writingTeile(exam).filter((t) => t.kind === 'message');
    const writing = writingReport(exam, {
      messages: messages.map((m) => ({ teil: m.teil, text: 'Liebe Frau Klein, ich bin krank.', selfMarked: 7.5, max: 10 })),
    });
    expect(writing).toContain(`Modelltest ${exam.id} – Schreiben`);
    if (messages[0].kind === 'message') expect(writing).toContain(messages[0].task.points[0].de);
    expect(writing).toContain('Mein Text (6 Wörter');
    expect(writing).toContain('7,5 von 10');

    const steps = speakingSteps(exam, [1], false);
    const first = steps[0];
    const levels = Object.fromEntries(steps.map((s) => [s.key, (s.criteria ?? []).map(() => 0)]));
    const speaking = speakingReport(exam, steps, { [first.key]: 'Ich heiße Ana.' }, levels);
    expect(speaking).toContain(`Modelltest ${exam.id} – Sprechen`);
    expect(speaking).toContain('Ich: Ich heiße Ana.');
    const max = stepsMax(steps);
    expect(speaking).toContain(`${markedPoints(steps, levels)} von ${max} Punkten`);
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

  it.each(ALL)('Modelltest %s has model messages that pass their own checks and fit the length', (_, exam) => {
    for (const t of writingTeile(exam)) {
      if (t.kind !== 'message') continue;
      const model = t.task.model.de;
      const [min, max] = t.words.startsWith('~') ? [25, 50] : t.words.split('–').map(Number);
      expect(hasGreeting(model), `Teil ${t.teil}`).toBe(true);
      expect(hasClosing(model), `Teil ${t.teil}`).toBe(true);
      expect(countWords(model), `Teil ${t.teil}`).toBeGreaterThanOrEqual(min);
      expect(countWords(model), `Teil ${t.teil}`).toBeLessThanOrEqual(max + 8);
    }
  });
});

import type {
  CalendarSlot,
  ExamAd,
  ExamLine,
  ExamQuestion,
  ExamSet,
  ExamText,
  FormField,
  Level,
  PictureOption,
  Titled,
  WritingTask,
} from '../data/types';
import { CRITERIA, HINTS, NO_AD, PERSON_QUESTIONS } from './examTexts';
import { shuffle } from './random';

/*
 * Model tests in two formats:
 * - "sd1", Start Deutsch 1 (A1): four parts of 15 raw points each, multiplied by 1.66.
 * - "a2", Goethe-Zertifikat A2: Lesen and Hören 20 items each and Schreiben 20 points, multiplied by 1.25;
 *   Sprechen is marked out of 25 directly. A pass also needs 45 of 75 in the written parts and 15 in Sprechen.
 * Either way the total is out of 100, and 60 passes.
 */

export type ExamFormat = ExamSet['format'];
export type ModuleId = 'hoeren' | 'lesen' | 'schreiben' | 'sprechen';

export interface ModuleInfo {
  id: ModuleId;
  icon: string;
  /** how long the part takes in the exam */
  minutes: number;
  teile: number;
  /** count down in exam mode; Hören is paced by its recordings and Sprechen by the partner */
  timed: boolean;
  needsSpeech?: boolean;
  /** raw points for the whole part, and what they are multiplied by for the certificate */
  rawMax: number;
  factor: number;
}

const hoeren = { id: 'hoeren', icon: '👂', timed: false, needsSpeech: true } as const;
const lesen = { id: 'lesen', icon: '📖', timed: true } as const;
const schreiben = { id: 'schreiben', icon: '✍️', timed: true } as const;
const sprechen = { id: 'sprechen', icon: '🗣️', timed: false } as const;

/** The parts of each exam, in the order they are taken. */
const FORMAT_MODULES: Record<ExamFormat, ModuleInfo[]> = {
  sd1: [
    { ...hoeren, minutes: 20, teile: 3, rawMax: 15, factor: 1.66 },
    { ...lesen, minutes: 25, teile: 3, rawMax: 15, factor: 1.66 },
    { ...schreiben, minutes: 20, teile: 2, rawMax: 15, factor: 1.66 },
    { ...sprechen, minutes: 15, teile: 3, rawMax: 15, factor: 1.66 },
  ],
  a2: [
    { ...lesen, minutes: 30, teile: 4, rawMax: 20, factor: 1.25 },
    { ...hoeren, minutes: 30, teile: 4, rawMax: 20, factor: 1.25 },
    { ...schreiben, minutes: 30, teile: 2, rawMax: 20, factor: 1.25 },
    { ...sprechen, minutes: 15, teile: 3, rawMax: 25, factor: 1 },
  ],
};

export const modulesOf = (exam: ExamSet) => FORMAT_MODULES[exam.format];

/** The parts' names in German, shown next to translated ones. */
export const GERMAN_NAMES: Record<ModuleId, string> = { hoeren: 'Hören', lesen: 'Lesen', schreiben: 'Schreiben', sprechen: 'Sprechen' };

export const EXAM_PREFIX = 'exam-';

/** The model test behind a page id like `exam-2`. */
export function examOf(level: Level, page: string): ExamSet | undefined {
  return page.startsWith(EXAM_PREFIX) ? level.exams.find((e) => e.id === page.slice(EXAM_PREFIX.length)) : undefined;
}

export interface Run {
  module: ModuleInfo;
  /** the Teile played: all of them as in the exam, or one to practise */
  teile: number[];
  /** exam mode: as in the exam (time limit, recordings played a set number of times, no feedback until the end) */
  exam: boolean;
}

/** `hoeren` runs the whole part as in the exam; `hoeren-2` practises its Teil 2. */
export function parseRun(exam: ExamSet, id: string): Run | null {
  const m = id.match(/^([a-z]+)(?:-(\d))?$/);
  const module = m && modulesOf(exam).find((x) => x.id === m[1]);
  if (!m || !module) return null;
  if (!m[2]) return { module, teile: Array.from({ length: module.teile }, (_, i) => i + 1), exam: true };
  const teil = Number(m[2]);
  return teil >= 1 && teil <= module.teile ? { module, teile: [teil], exam: false } : null;
}

export const resultKey = (level: Level, exam: ExamSet, module: ModuleId) => `${level.id}/${EXAM_PREFIX}${exam.id}/${module}`;

export const PASS_MARK = 60;

/** A part's raw points on the certificate's scale (25 per part). */
export const scaled = (module: ModuleInfo, raw: number) => Math.round(raw * module.factor);

export interface Outcome {
  total: number;
  passed: boolean;
  /** an A2 pass needs 45 of 75 in the written parts and 15 of 25 in Sprechen, besides 60 overall */
  short?: 'written' | 'oral';
}

/** The result out of 100 from each part's raw points (in `modulesOf` order). */
export function outcome(exam: ExamSet, raws: number[]): Outcome {
  const modules = modulesOf(exam);
  const points = modules.map((m, i) => raws[i] * m.factor);
  const total = Math.round(points.reduce((sum, p) => sum + p, 0));
  if (exam.format === 'sd1') return { total, passed: total >= PASS_MARK };
  const written = Math.round(points.filter((_, i) => modules[i].id !== 'sprechen').reduce((sum, p) => sum + p, 0));
  const oral = points[modules.findIndex((m) => m.id === 'sprechen')];
  const short = written < 45 ? 'written' : oral < 15 ? 'oral' : undefined;
  return { total, passed: total >= PASS_MARK && !short, short };
}

/** The grade printed on the certificate. */
export function predicate(total: number): string {
  if (total >= 90) return 'sehr gut';
  if (total >= 80) return 'gut';
  if (total >= 70) return 'befriedigend';
  if (total >= PASS_MARK) return 'ausreichend';
  return 'nicht bestanden';
}

/** German decimal comma: 7.5 → "7,5". */
export const points = (n: number) => String(n).replace('.', ',');

// ———————————————————————————————— Self-marking ————————————————————————————————

/**
 * One thing the learner marks, as on the exam's marking sheets: Start Deutsch 1 gives full, half or no
 * marks per task ("done", "partly", "not done"); Goethe A2 marks each Teil A to E per criterion.
 */
export interface Criterion {
  key: string;
  label?: Titled;
  /** points for each level, best first */
  points: number[];
  scale: 'done' | 'ae';
  /** what each level means, best first */
  hints?: Titled[];
  /** the exam's rule for Aufgabenerfüllung: if this gets the lowest level, the whole group scores 0 */
  gate?: boolean;
}

const done = (key: string, max: number, label?: Titled): Criterion => ({ key, label, points: [max, max / 2, 0], scale: 'done' });
const ae = (key: string, label: Titled, top: number, hints: Titled[], gate = false): Criterion => ({
  key,
  label,
  // The A2 sheets use 5/3.5/2/0.5/0, 4/3/2/1/0 and 2/1.5/1/0.5/0.
  points: top === 5 ? [5, 3.5, 2, 0.5, 0] : top === 4 ? [4, 3, 2, 1, 0] : [2, 1.5, 1, 0.5, 0],
  scale: 'ae',
  hints,
  gate,
});

export const maxPoints = (criteria: Criterion[]) => criteria.reduce((sum, c) => sum + c.points[0], 0);

/** Points for criteria marked together; `levels` index each criterion's points (null = not marked yet). */
export function groupPoints(criteria: Criterion[], levels: (number | null)[] = []): number {
  const gate = criteria.findIndex((c) => c.gate);
  if (gate >= 0 && levels[gate] === criteria[gate].points.length - 1) return 0;
  return criteria.reduce((sum, c, i) => sum + (levels[i] === null || levels[i] === undefined ? 0 : c.points[levels[i]!]), 0);
}

// ———————————————————————————————— Hören and Lesen ————————————————————————————————

export const RICHTIG_FALSCH = ['richtig', 'falsch'];
export const JA_NEIN = ['Ja', 'Nein'];
export const LETTERS = 'abcdefghi'.split('');

/** One question as shown: its number in the part, the German text, the choices and the right one. */
export interface ExamItem {
  key: string;
  n: number;
  teil: number;
  /** a/b/c, richtig/falsch or Ja/Nein, one of two ads, or a letter for a picture or ad shown above */
  kind: 'abc' | 'rf' | 'ads' | 'match';
  q: Titled;
  options: string[];
  answer: number;
  /** for 'match': what each letter stands for, for the review */
  labels?: string[];
}

export type Stimulus =
  | { kind: 'audio'; lines: ExamLine[]; plays: number; pictures?: PictureOption[] }
  | { kind: 'text'; text: ExamText }
  | { kind: 'ads'; ads: [ExamAd, ExamAd] }
  | { kind: 'adlist'; ads: ExamAd[] }
  | { kind: 'sign'; sign: Titled; where: Titled };

/** What the learner hears or reads, and the questions about it. */
export interface ExamPage {
  key: string;
  teil: number;
  stimulus: Stimulus;
  /** a question over all the items, e.g. "Was macht Lena wann?" */
  q?: Titled;
  items: ExamItem[];
}

type Choice = Pick<ExamItem, 'kind' | 'options' | 'answer' | 'labels'>;

const choiceOf = (q: ExamQuestion, yesNo = RICHTIG_FALSCH): Choice =>
  typeof q.a === 'boolean'
    ? { kind: 'rf', options: yesNo, answer: q.a ? 0 : 1 }
    : { kind: 'abc', options: q.options ?? [], answer: q.a };

/** Every page of Hören or Lesen in exam order, numbered across the part, then narrowed to `teile`. */
export function choicePages(exam: ExamSet, module: 'hoeren' | 'lesen', teile: number[]): ExamPage[] {
  const pages: ExamPage[] = [];
  let n = 0;
  const item = (key: string, teil: number, q: Titled, choice: Choice): ExamItem => ({
    key,
    n: ++n,
    teil,
    q: { de: q.de, en: q.en, es: q.es },
    ...choice,
  });
  const audioPage = (teil: number, i: number, x: ExamQuestion & { audio: ExamLine[] }, plays: number) => {
    const key = `hoeren-${teil}-${i}`;
    pages.push({ key, teil, stimulus: { kind: 'audio', lines: x.audio, plays }, items: [item(key, teil, x, choiceOf(x))] });
  };
  const textPage = (teil: number, i: number, text: ExamText, qs: ExamQuestion[]) => {
    const key = `lesen-${teil}-${i}`;
    pages.push({ key, teil, stimulus: { kind: 'text', text }, items: qs.map((q, j) => item(`${key}-${j}`, teil, q, choiceOf(q))) });
  };

  if (exam.format === 'sd1') {
    if (module === 'hoeren') {
      // In the exam, Teil 2's announcements are heard once, the rest twice.
      exam.hoeren.teil1.forEach((x, i) => audioPage(1, i, x, 2));
      exam.hoeren.teil2.forEach((x, i) => audioPage(2, i, x, 1));
      exam.hoeren.teil3.forEach((x, i) => audioPage(3, i, x, 2));
    } else {
      exam.lesen.teil1.forEach((x, i) => textPage(1, i, x.text, x.items));
      exam.lesen.teil2.forEach((x, i) => {
        const key = `lesen-2-${i}`;
        const choice: Choice = { kind: 'ads', options: ['a', 'b'], answer: x.a };
        pages.push({ key, teil: 2, stimulus: { kind: 'ads', ads: x.ads }, items: [item(key, 2, x, choice)] });
      });
      exam.lesen.teil3.forEach((x, i) => {
        const key = `lesen-3-${i}`;
        pages.push({ key, teil: 3, stimulus: { kind: 'sign', sign: x.sign, where: x.where }, items: [item(key, 3, x, choiceOf(x))] });
      });
    }
  } else if (module === 'hoeren') {
    const { teil1, teil2, teil3, teil4 } = exam.hoeren;
    // Teil 1 and the interview are heard twice, the conversations in Teil 2 and 3 once.
    teil1.forEach((x, i) => audioPage(1, i, x, 2));
    const letters = LETTERS.slice(0, teil2.options.length);
    pages.push({
      key: 'hoeren-2',
      teil: 2,
      stimulus: { kind: 'audio', lines: teil2.audio, plays: 1, pictures: teil2.options },
      q: teil2.q,
      items: teil2.items.map((x, j) =>
        item(`hoeren-2-${j}`, 2, x, { kind: 'match', options: letters, answer: x.a ?? 0, labels: teil2.options.map((o) => `${o.emoji} ${o.de}`) }),
      ),
    });
    teil3.forEach((x, i) => audioPage(3, i, x, 1));
    pages.push({
      key: 'hoeren-4',
      teil: 4,
      stimulus: { kind: 'audio', lines: teil4.audio, plays: 2 },
      items: teil4.items.map((q, j) => item(`hoeren-4-${j}`, 4, q, choiceOf(q, JA_NEIN))),
    });
  } else {
    const { teil1, teil2, teil3, teil4 } = exam.lesen;
    textPage(1, 0, teil1.text, teil1.items);
    textPage(2, 0, teil2.text, teil2.items);
    textPage(3, 0, teil3.text, teil3.items);
    // Letters for the ads, then X for "no ad fits".
    const options = [...LETTERS.slice(0, teil4.ads.length), 'X'];
    const labels = [...teil4.ads.map((ad) => ad.title), NO_AD.de];
    pages.push({
      key: 'lesen-4',
      teil: 4,
      stimulus: { kind: 'adlist', ads: teil4.ads },
      items: teil4.items.map((x, j) =>
        item(`lesen-4-${j}`, 4, x, { kind: 'match', options, answer: x.a ?? teil4.ads.length, labels }),
      ),
    });
  }
  return pages.filter((p) => teile.includes(p.teil));
}

// ———————————————————————————————— Schreiben ————————————————————————————————

export type WritingTeil =
  | { kind: 'form'; teil: number; text: Titled; title: string; fields: FormField[] }
  | { kind: 'message'; teil: number; task: WritingTask; words: string; criteria: Criterion[] };

/** The Teile of Schreiben: Start Deutsch 1 has a form and a message, Goethe A2 two messages. */
export function writingTeile(exam: ExamSet): WritingTeil[] {
  if (exam.format === 'sd1') {
    const { teil1, teil2 } = exam.schreiben;
    return [
      { kind: 'form', teil: 1, ...teil1 },
      {
        kind: 'message',
        teil: 2,
        task: teil2,
        words: '~30',
        // Each content point is worth 3 points, greeting and sign-off 1.
        criteria: [...teil2.points.map((p, i) => done(`point${i}`, 3, p)), done('form', 1, CRITERIA.form)],
      },
    ];
  }
  const criteria = [ae('task', CRITERIA.task, 5, HINTS.writingTask, true), ae('language', CRITERIA.language, 5, HINTS.language)];
  return [
    { kind: 'message', teil: 1, task: exam.schreiben.teil1, words: '20–30', criteria },
    { kind: 'message', teil: 2, task: exam.schreiben.teil2, words: '30–40', criteria },
  ];
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
}

/** "Liebe Anna," / "Sehr geehrte Damen und Herren," … at the start. */
export const hasGreeting = (text: string) =>
  /^\s*(liebe|lieber|liebes|hallo|hi|guten tag|sehr geehrte|sehr geehrter|sehr geehrtes)\b/i.test(text);

/** "Viele Grüße", "Tschüss", "Bis bald" … somewhere in the last lines. */
export const hasClosing = (text: string) =>
  /(gr(ü|ue)(ß|ss)e|gr(ü|ue)(ß|ss)en|gru(ß|ss)|tsch(ü|ue)ss?|bis (bald|dann|morgen|gleich|später|nachher)|ciao)/i.test(text.slice(-80));

// ———————————————————————————————— Sprechen ————————————————————————————————

/** The keywords on the table in Sprechen Teil 1 of Start Deutsch 1. */
export const INTRO_KEYWORDS = ['Name?', 'Alter?', 'Land?', 'Wohnort?', 'Sprachen?', 'Beruf?', 'Hobby?'];

export type SpeakKind = 'intro' | 'spell' | 'number' | 'ask' | 'answer' | 'request' | 'react' | 'talk' | 'plan' | 'mark';

/** One turn of the speaking test, played against the app as partner, or a page of marks. */
export interface SpeakStep {
  key: string;
  teil: number;
  kind: SpeakKind;
  /** what the examiner or partner says, read aloud */
  partner?: Titled;
  topic?: Titled;
  /** the word card (ask), picture card (request, react) or talking card with its prompts (talk) */
  word?: string;
  emoji?: string;
  q?: Titled;
  prompts?: string[];
  /** planning: the task, the day and the learner's calendar */
  task?: Titled;
  day?: string;
  calendar?: CalendarSlot[];
  /** an example of a good turn; none on a page of marks */
  model?: Titled;
  /** how the partner might go on, e.g. an answer to the learner's question */
  reply?: Titled;
  /** Start Deutsch 1 marks each turn; Goethe A2 marks each Teil on a page of its own ('mark') */
  criteria?: Criterion[];
}

/**
 * The turns of Sprechen.
 * - Start Deutsch 1: introduce yourself, spell, give a number (1 point each); per topic, ask a question about a
 *   card (2) and answer one (1); twice make a request from a picture (2) and react to one (1).
 * - Goethe A2: ask four questions with cards and answer four; talk about yourself and answer a question; plan
 *   something with the partner. Each Teil is marked for task and language, and the whole for pronunciation.
 */
export function speakingSteps(exam: ExamSet, teile: number[], pronunciation: boolean): SpeakStep[] {
  const steps: SpeakStep[] = [];
  const marked = (max: number) => [done('turn', max)];
  if (exam.format === 'sd1') {
    const s = exam.sprechen;
    if (teile.includes(1)) {
      steps.push(
        { key: 'intro', teil: 1, kind: 'intro', model: s.teil1.model, criteria: marked(1) },
        { key: 'spell', teil: 1, kind: 'spell', partner: s.teil1.spell.q, model: s.teil1.spell.a, criteria: marked(1) },
        { key: 'number', teil: 1, kind: 'number', partner: s.teil1.number.q, model: s.teil1.number.a, criteria: marked(1) },
      );
    }
    if (teile.includes(2)) {
      s.teil2.forEach(({ topic, cards }, i) => {
        const [mine, theirs] = shuffle(cards);
        steps.push(
          { key: `ask-${i}`, teil: 2, kind: 'ask', topic, word: mine.word, model: mine.q, reply: mine.a, criteria: marked(2) },
          { key: `answer-${i}`, teil: 2, kind: 'answer', topic, partner: theirs.q, model: theirs.a, criteria: marked(1) },
        );
      });
    }
    if (teile.includes(3)) {
      const cards = shuffle(s.teil3);
      for (let i = 0; i < 2; i++) {
        const mine = cards[i * 2];
        const theirs = cards[i * 2 + 1];
        steps.push(
          { key: `request-${i}`, teil: 3, kind: 'request', emoji: mine.emoji, model: mine.request, reply: mine.reply, criteria: marked(2) },
          { key: `react-${i}`, teil: 3, kind: 'react', emoji: theirs.emoji, partner: theirs.request, model: theirs.reply, criteria: marked(1) },
        );
      }
    }
    return steps;
  }

  const s = exam.sprechen;
  const mark = (teil: number, task: number, language: number) =>
    steps.push({
      key: `mark-${teil}`,
      teil,
      kind: 'mark',
      criteria: [ae('task', CRITERIA.task, task, HINTS.speakingTask, true), ae('language', CRITERIA.language, language, HINTS.language)],
    });
  if (teile.includes(1)) {
    s.teil1.cards.forEach((card, i) =>
      steps.push({ key: `ask-${i}`, teil: 1, kind: 'ask', topic: PERSON_QUESTIONS, word: card.word, model: card.q, reply: card.a }),
    );
    s.teil1.partner.forEach((x, i) => steps.push({ key: `answer-${i}`, teil: 1, kind: 'answer', partner: x.q, model: x.a }));
    mark(1, 2, 2);
  }
  if (teile.includes(2)) {
    const t = s.teil2;
    steps.push(
      { key: 'talk', teil: 2, kind: 'talk', q: t.q, prompts: t.prompts, model: t.model },
      { key: 'follow-up', teil: 2, kind: 'answer', partner: t.followUp.q, model: t.followUp.a },
    );
    mark(2, 5, 4);
  }
  if (teile.includes(3)) {
    const t = s.teil3;
    t.turns.forEach((turn, i) =>
      steps.push({ key: `plan-${i}`, teil: 3, kind: 'plan', task: t.task, day: t.day, calendar: t.calendar, partner: turn.partner, model: turn.model }),
    );
    mark(3, 4, 4);
  }
  if (pronunciation) {
    steps.push({
      key: 'mark-pronunciation',
      teil: Math.max(...teile),
      kind: 'mark',
      criteria: [ae('pronunciation', CRITERIA.pronunciation, 4, HINTS.pronunciation)],
    });
  }
  return steps;
}

/** The most a run of speaking steps can score. */
export const stepsMax = (steps: SpeakStep[]) => steps.reduce((sum, s) => sum + maxPoints(s.criteria ?? []), 0);

/** Raw points from self-marked steps, rounded to whole points as in the exam. */
export function markedPoints(steps: SpeakStep[], levels: Record<string, (number | null)[]>): number {
  return Math.round(steps.reduce((sum, s) => sum + (s.criteria ? groupPoints(s.criteria, levels[s.key]) : 0), 0));
}

// ———————————————————————————————— Reports for a teacher ————————————————————————————————

const quote = (s: string) => `„${s}“`;
const FORMAT_NAMES: Record<ExamFormat, string> = { sd1: 'Start Deutsch 1, A1', a2: 'Goethe-Zertifikat A2' };
const head = (exam: ExamSet, part: string) => `Modelltest ${exam.id} – ${part} (${FORMAT_NAMES[exam.format]})`;

export interface WritingReport {
  /** the form's gaps: what was written and whether it was right */
  form?: { label: string; text: string; ok: boolean }[];
  /** each message written, with the learner's own marks if given */
  messages: { teil: number; text: string; selfMarked?: number; max: number }[];
}

/** Plain text a learner can send to a teacher: the tasks and their answers. */
export function writingReport(exam: ExamSet, r: WritingReport): string {
  const lines = [head(exam, 'Schreiben'), ''];
  const teile = writingTeile(exam);
  for (const t of teile) {
    if (t.kind === 'form' && r.form) {
      const ok = r.form.filter((f) => f.ok).length;
      lines.push(`Teil ${t.teil} – Formular „${t.title}“ (${ok}/${r.form.length} richtig)`);
      r.form.forEach((f, i) => lines.push(`${i + 1}. ${f.label}: ${f.text.trim() || '—'}${f.ok ? ' ✓' : ' ✗'}`));
      lines.push('');
    }
    const m = t.kind === 'message' && r.messages.find((x) => x.teil === t.teil);
    if (t.kind === 'message' && m) {
      lines.push(`Teil ${t.teil} – Aufgabe:`, t.task.task.de, ...t.task.points.map((p) => `– ${p.de}`), '');
      lines.push(`Mein Text (${countWords(m.text)} Wörter, verlangt: ${t.words}):`, m.text.trim() || '—');
      if (m.selfMarked !== undefined) lines.push(`Meine Selbstbewertung: ${points(m.selfMarked)} von ${m.max} Punkten`);
      lines.push('');
    }
  }
  return lines.join('\n').trim();
}

/** German names of the speaking tasks, as a teacher would know them. */
export const TASK_NAMES: Record<SpeakKind, string> = {
  intro: 'Sich vorstellen',
  spell: 'Buchstabieren',
  number: 'Eine Nummer nennen',
  ask: 'Eine Frage stellen',
  answer: 'Auf eine Frage antworten',
  request: 'Eine Bitte formulieren',
  react: 'Auf eine Bitte reagieren',
  talk: 'Von sich erzählen',
  plan: 'Etwas gemeinsam planen',
  mark: 'Selbstbewertung',
};

const LEVEL_NAMES = 'ABCDE';

/** The speaking tasks, what the learner noted down for each, and their own marks, for a teacher. */
export function speakingReport(
  exam: ExamSet,
  steps: SpeakStep[],
  notes: Record<string, string>,
  levels: Record<string, (number | null)[]>,
): string {
  const lines = [head(exam, 'Sprechen'), ''];
  for (const step of steps) {
    if (step.kind === 'mark') {
      const marks = (step.criteria ?? []).map((c, i) => {
        const level = levels[step.key]?.[i];
        return `${c.label?.de}: ${level === null || level === undefined ? '—' : `${LEVEL_NAMES[level]} (${points(c.points[level])}/${c.points[0]})`}`;
      });
      const where = step.key === 'mark-pronunciation' ? 'Ganze Prüfung' : `Teil ${step.teil}`;
      lines.push(`${where} – Selbstbewertung: ${marks.join(', ')}`, '');
      continue;
    }
    const card = [
      step.topic && `Thema ${step.topic.de}`,
      step.word && `Karte ${quote(step.word)}`,
      step.q && `Karte ${quote(step.q.de)}`,
      step.emoji && `Bild ${step.emoji}`,
    ]
      .filter(Boolean)
      .join(', ');
    lines.push(`Teil ${step.teil} – ${TASK_NAMES[step.kind]}${card ? ` (${card})` : ''}`);
    if (step.partner) lines.push(`Partner: ${quote(step.partner.de)}`);
    lines.push(`Ich: ${notes[step.key]?.trim() || '—'}`, '');
  }
  lines.push(`Meine Selbstbewertung insgesamt: ${points(markedPoints(steps, levels))} von ${stepsMax(steps)} Punkten`);
  return lines.join('\n').trim();
}

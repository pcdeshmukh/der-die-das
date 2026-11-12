import type { ExamAd, ExamLine, ExamQuestion, ExamSet, ExamText, Level, Titled } from '../data/types';
import { shuffle } from './random';

/*
 * Model tests in the format of "Start Deutsch 1" (A1). The exam has four parts of 15 raw points each.
 * Each part's points are multiplied by 1.66 and added up, so the maximum is 100; 60 passes.
 */

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
}

export const MODULES: ModuleInfo[] = [
  { id: 'hoeren', icon: '👂', minutes: 20, teile: 3, timed: false, needsSpeech: true },
  { id: 'lesen', icon: '📖', minutes: 25, teile: 3, timed: true },
  { id: 'schreiben', icon: '✍️', minutes: 20, teile: 2, timed: true },
  { id: 'sprechen', icon: '🗣️', minutes: 15, teile: 3, timed: false },
];

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
export function parseRun(id: string): Run | null {
  const m = id.match(/^([a-z]+)(?:-(\d))?$/);
  const module = m && MODULES.find((x) => x.id === m[1]);
  if (!m || !module) return null;
  if (!m[2]) return { module, teile: Array.from({ length: module.teile }, (_, i) => i + 1), exam: true };
  const teil = Number(m[2]);
  return teil >= 1 && teil <= module.teile ? { module, teile: [teil], exam: false } : null;
}

export const resultKey = (level: Level, exam: ExamSet, module: ModuleId) => `${level.id}/${EXAM_PREFIX}${exam.id}/${module}`;

export const RAW_MAX = 15;
const FACTOR = 1.66;
export const PASS_MARK = 60;

/** A part's raw points on the certificate's scale (25 per part). */
export const scaled = (raw: number) => Math.round(raw * FACTOR);

/** The result out of 100, from the four parts' raw points. */
export const totalScore = (raws: number[]) => Math.round(raws.reduce((sum, r) => sum + r, 0) * FACTOR);

/** The grade printed on the certificate. */
export function predicate(total: number): string {
  if (total >= 90) return 'sehr gut';
  if (total >= 80) return 'gut';
  if (total >= 70) return 'befriedigend';
  if (total >= PASS_MARK) return 'ausreichend';
  return 'nicht bestanden';
}

/** Marking as in the exam: full marks, half marks (understandable, with mistakes), or none. */
export type Rating = 1 | 0.5 | 0;
export const RATINGS: Rating[] = [1, 0.5, 0];

/** Points for each content point of the message in Schreiben Teil 2, and for greeting and sign-off. */
export const POINT_MAX = 3;
export const FORM_MAX = 1;

/** German decimal comma: 7.5 → "7,5". */
export const points = (n: number) => String(n).replace('.', ',');

// ———————————————————————————————— Hören and Lesen ————————————————————————————————

export const RICHTIG_FALSCH = ['richtig', 'falsch'];
export const ABC = ['a', 'b', 'c'];

/** One question as shown: its number in the part, the German text, the choices and the right one. */
export interface ExamItem {
  key: string;
  n: number;
  teil: number;
  kind: 'abc' | 'rf' | 'ads';
  q: Titled;
  options: string[];
  answer: number;
}

export type Stimulus =
  | { kind: 'audio'; lines: ExamLine[]; plays: number }
  | { kind: 'text'; text: ExamText }
  | { kind: 'ads'; ads: [ExamAd, ExamAd] }
  | { kind: 'sign'; sign: Titled; where: Titled };

/** What the learner hears or reads, and the questions about it. */
export interface ExamPage {
  key: string;
  teil: number;
  stimulus: Stimulus;
  items: ExamItem[];
}

type Choice = Pick<ExamItem, 'kind' | 'options' | 'answer'>;

const choiceOf = (q: ExamQuestion): Choice =>
  typeof q.a === 'boolean'
    ? { kind: 'rf', options: RICHTIG_FALSCH, answer: q.a ? 0 : 1 }
    : { kind: 'abc', options: q.options ?? [], answer: q.a };

/** Every page of Hören or Lesen in exam order, numbered 1–15 across the part, then narrowed to `teile`. */
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
  if (module === 'hoeren') {
    const parts = [exam.hoeren.teil1, exam.hoeren.teil2, exam.hoeren.teil3];
    parts.forEach((items, p) =>
      items.forEach((x, i) => {
        const teil = p + 1;
        const key = `hoeren-${teil}-${i}`;
        // In the exam, Teil 2's announcements are heard once, the rest twice.
        const stimulus: Stimulus = { kind: 'audio', lines: x.audio, plays: teil === 2 ? 1 : 2 };
        pages.push({ key, teil, stimulus, items: [item(key, teil, x, choiceOf(x))] });
      }),
    );
  } else {
    exam.lesen.teil1.forEach((x, i) => {
      const key = `lesen-1-${i}`;
      const items = x.items.map((q, j) => item(`${key}-${j}`, 1, q, choiceOf(q)));
      pages.push({ key, teil: 1, stimulus: { kind: 'text', text: x.text }, items });
    });
    exam.lesen.teil2.forEach((x, i) => {
      const key = `lesen-2-${i}`;
      pages.push({ key, teil: 2, stimulus: { kind: 'ads', ads: x.ads }, items: [item(key, 2, x, { kind: 'ads', options: ['a', 'b'], answer: x.a })] });
    });
    exam.lesen.teil3.forEach((x, i) => {
      const key = `lesen-3-${i}`;
      pages.push({ key, teil: 3, stimulus: { kind: 'sign', sign: x.sign, where: x.where }, items: [item(key, 3, x, choiceOf(x))] });
    });
  }
  return pages.filter((p) => teile.includes(p.teil));
}

// ———————————————————————————————— Schreiben ————————————————————————————————

export function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => /[\p{L}\d]/u.test(w)).length;
}

/** "Liebe Anna," / "Sehr geehrte Damen und Herren," … at the start. */
export const hasGreeting = (text: string) =>
  /^\s*(liebe|lieber|liebes|hallo|hi|guten tag|sehr geehrte|sehr geehrter|sehr geehrtes)\b/i.test(text);

/** "Viele Grüße", "Tschüss", "Bis bald" … somewhere in the last lines. */
export const hasClosing = (text: string) =>
  /(gr(ü|ue)(ß|ss)e|gr(ü|ue)(ß|ss)en|gru(ß|ss)|tsch(ü|ue)ss?|bis bald|bis dann|bis morgen|ciao)/i.test(text.slice(-80));

// ———————————————————————————————— Sprechen ————————————————————————————————

/** The keywords on the table in Sprechen Teil 1. */
export const INTRO_KEYWORDS = ['Name?', 'Alter?', 'Land?', 'Wohnort?', 'Sprachen?', 'Beruf?', 'Hobby?'];

export type SpeakKind = 'intro' | 'spell' | 'number' | 'ask' | 'answer' | 'request' | 'react';

/** One turn of the speaking test, played against the app as partner. */
export interface SpeakStep {
  key: string;
  teil: number;
  kind: SpeakKind;
  /** points for full marks */
  max: number;
  /** what the examiner or partner says, read aloud */
  partner?: Titled;
  topic?: Titled;
  /** the word card (Teil 2) or picture card (Teil 3) the learner holds */
  word?: string;
  emoji?: string;
  /** an example of a good turn */
  model: Titled;
  /** how the partner might go on, e.g. an answer to the learner's question */
  reply?: Titled;
}

/**
 * The turns of Sprechen: introduce yourself, spell, give a number (1 point each); per topic, ask a question
 * about a card (2) and answer one (1); twice make a request from a picture (2) and react to one (1).
 */
export function speakingSteps(exam: ExamSet, teile: number[]): SpeakStep[] {
  const s = exam.sprechen;
  const steps: SpeakStep[] = [];
  if (teile.includes(1)) {
    steps.push(
      { key: 'intro', teil: 1, kind: 'intro', max: 1, model: s.teil1.model },
      { key: 'spell', teil: 1, kind: 'spell', max: 1, partner: s.teil1.spell.q, model: s.teil1.spell.a },
      { key: 'number', teil: 1, kind: 'number', max: 1, partner: s.teil1.number.q, model: s.teil1.number.a },
    );
  }
  if (teile.includes(2)) {
    s.teil2.forEach(({ topic, cards }, i) => {
      const [mine, theirs] = shuffle(cards);
      steps.push(
        { key: `ask-${i}`, teil: 2, kind: 'ask', max: 2, topic, word: mine.word, model: mine.q, reply: mine.a },
        { key: `answer-${i}`, teil: 2, kind: 'answer', max: 1, topic, word: theirs.word, partner: theirs.q, model: theirs.a },
      );
    });
  }
  if (teile.includes(3)) {
    const cards = shuffle(s.teil3);
    for (let i = 0; i < 2; i++) {
      const mine = cards[i * 2];
      const theirs = cards[i * 2 + 1];
      steps.push(
        { key: `request-${i}`, teil: 3, kind: 'request', max: 2, emoji: mine.emoji, model: mine.request, reply: mine.reply },
        { key: `react-${i}`, teil: 3, kind: 'react', max: 1, emoji: theirs.emoji, partner: theirs.request, model: theirs.reply },
      );
    }
  }
  return steps;
}

/** Raw points from self-marked tasks (`max` × rating), rounded to whole points as in the exam. */
export function markedPoints(tasks: { max: number; rating: Rating | null }[]): number {
  return Math.round(tasks.reduce((sum, x) => sum + x.max * (x.rating ?? 0), 0));
}

// ———————————————————————————————— Reports for a teacher ————————————————————————————————

const quote = (s: string) => `„${s}“`;
const head = (exam: ExamSet, part: string) => `Modelltest ${exam.id} – ${part} (Start Deutsch 1, A1)`;

export interface WritingReport {
  /** Teil 1: what was written in each gap, and whether it was right; absent when Teil 1 wasn't played */
  form?: { label: string; text: string; ok: boolean }[];
  /** Teil 2: the message, absent when Teil 2 wasn't played */
  text?: string;
  /** the learner's own marks for Teil 2, if given */
  selfMarked?: number;
}

/** Plain text a learner can send to a teacher: the tasks and their answers. */
export function writingReport(exam: ExamSet, r: WritingReport): string {
  const lines = [head(exam, 'Schreiben'), ''];
  if (r.form) {
    const ok = r.form.filter((f) => f.ok).length;
    lines.push(`Teil 1 – Formular „${exam.schreiben.teil1.title}“ (${ok}/${r.form.length} richtig)`);
    r.form.forEach((f, i) => lines.push(`${i + 1}. ${f.label}: ${f.text.trim() || '—'}${f.ok ? ' ✓' : ' ✗'}`));
    lines.push('');
  }
  if (r.text !== undefined) {
    const t2 = exam.schreiben.teil2;
    lines.push('Teil 2 – Aufgabe:', t2.task.de, ...t2.points.map((p) => `– ${p.de}`), '');
    lines.push(`Mein Text (${countWords(r.text)} Wörter):`, r.text.trim() || '—');
    if (r.selfMarked !== undefined) lines.push('', `Meine Selbstbewertung: ${points(r.selfMarked)} von 10 Punkten`);
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
};

/** The speaking tasks and what the learner noted down for each, for a teacher to mark. */
export function speakingReport(exam: ExamSet, steps: SpeakStep[], notes: Record<string, string>, selfMarked?: number): string {
  const lines = [head(exam, 'Sprechen'), ''];
  for (const step of steps) {
    const card = [step.topic && `Thema ${step.topic.de}`, step.word && `Karte ${quote(step.word)}`, step.emoji && `Bild ${step.emoji}`]
      .filter(Boolean)
      .join(', ');
    lines.push(`Teil ${step.teil} – ${TASK_NAMES[step.kind]}${card ? ` (${card})` : ''}`);
    if (step.partner) lines.push(`Partner: ${quote(step.partner.de)}`);
    lines.push(`Ich: ${notes[step.key]?.trim() || '—'}`, '');
  }
  if (selfMarked !== undefined) lines.push(`Meine Selbstbewertung: ${points(selfMarked)} von ${steps.reduce((s, x) => s + x.max, 0)} Punkten`);
  return lines.join('\n').trim();
}

// ———————————————————————————————— Instructions ————————————————————————————————

/** Instructions per part and Teil, worded like the exam paper, with translations. */
export const INSTRUCTIONS: Record<ModuleId, Titled[]> = {
  hoeren: [
    {
      de: 'Sie hören sechs kurze Gespräche. Sie hören jeden Text zweimal. Wählen Sie die richtige Lösung: a, b oder c.',
      en: 'You will hear six short conversations. You will hear each one twice. Choose the right answer: a, b or c.',
      es: 'Vas a oír seis conversaciones breves. Oirás cada una dos veces. Elige la respuesta correcta: a, b o c.',
    },
    {
      de: 'Sie hören vier Durchsagen. Sie hören jeden Text einmal. Ist der Satz richtig oder falsch?',
      en: 'You will hear four announcements. You will hear each one once. Is the sentence right or wrong?',
      es: 'Vas a oír cuatro anuncios. Oirás cada uno una sola vez. ¿La frase es verdadera o falsa?',
    },
    {
      de: 'Sie hören fünf Nachrichten am Telefon. Sie hören jeden Text zweimal. Wählen Sie die richtige Lösung: a, b oder c.',
      en: 'You will hear five telephone messages. You will hear each one twice. Choose the right answer: a, b or c.',
      es: 'Vas a oír cinco mensajes de teléfono. Oirás cada uno dos veces. Elige la respuesta correcta: a, b o c.',
    },
  ],
  lesen: [
    {
      de: 'Lesen Sie die zwei Texte. Sind die Sätze richtig oder falsch?',
      en: 'Read the two texts. Are the sentences right or wrong?',
      es: 'Lee los dos textos. ¿Las frases son verdaderas o falsas?',
    },
    {
      de: 'Lesen Sie die Situationen und die Anzeigen. Wo finden Sie die Information? Wählen Sie a oder b.',
      en: 'Read the situations and the ads. Where do you find the information? Choose a or b.',
      es: 'Lee las situaciones y los anuncios. ¿Dónde encuentras la información? Elige a o b.',
    },
    {
      de: 'Lesen Sie die Schilder und Aushänge. Ist der Satz richtig oder falsch?',
      en: 'Read the signs and notices. Is the sentence right or wrong?',
      es: 'Lee los carteles y avisos. ¿La frase es verdadera o falsa?',
    },
  ],
  schreiben: [
    {
      de: 'Lesen Sie den Text. Im Formular fehlen fünf Informationen. Schreiben Sie sie in das Formular.',
      en: 'Read the text. Five pieces of information are missing from the form. Write them in.',
      es: 'Lee el texto. En el formulario faltan cinco datos. Escríbelos en el formulario.',
    },
    {
      de: 'Schreiben Sie eine kurze Nachricht (circa 30 Wörter). Schreiben Sie zu allen drei Punkten. Denken Sie an Anrede und Gruß.',
      en: 'Write a short message (about 30 words). Write about all three points. Remember a greeting and a sign-off.',
      es: 'Escribe un mensaje breve (unas 30 palabras). Escribe sobre los tres puntos. No olvides el saludo y la despedida.',
    },
  ],
  sprechen: [
    {
      de: 'Stellen Sie sich vor. Danach buchstabieren Sie etwas und nennen eine Nummer.',
      en: 'Introduce yourself. Then spell something and give a number.',
      es: 'Preséntate. Después deletrea algo y di un número.',
    },
    {
      de: 'Sie und Ihr Partner sprechen über ein Thema. Stellen Sie eine Frage zu Ihrer Karte. Antworten Sie auf eine Frage.',
      en: 'You and your partner talk about a topic. Ask a question about your card. Answer a question.',
      es: 'Tú y tu compañero habláis de un tema. Haz una pregunta sobre tu tarjeta. Responde a una pregunta.',
    },
    {
      de: 'Sehen Sie die Karte an und bitten Sie Ihren Partner um etwas. Reagieren Sie auf eine Bitte.',
      en: 'Look at the card and ask your partner for something. React to a request.',
      es: 'Mira la tarjeta y pide algo a tu compañero. Reacciona a una petición.',
    },
  ],
};

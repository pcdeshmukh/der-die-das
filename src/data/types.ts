export type Article = 'der' | 'die' | 'das';
export const ARTICLES: Article[] = ['der', 'die', 'das'];

/** Text shown to the learner in their own language. */
export interface Translated {
  en: string;
  es: string;
}

export type Titled = { de: string; en: string; es: string };

export interface Noun extends Translated {
  de: string;
  article: Article;
  /** null when the noun has no (common) plural */
  plural: string | null;
  emoji?: string;
}

export interface Sentence extends Translated {
  de: string;
  /** other word orders that are also correct */
  alt?: string[];
}

export interface Topic {
  id: string;
  title: Titled;
  emoji: string;
  nouns: Noun[];
  sentences: Sentence[];
}

/** A noun with a stable id, used for progress tracking. */
export interface WordRef extends Noun {
  id: string;
  topic: string;
}

export interface SentenceRef extends Sentence {
  id: string;
  topic: string;
}

export interface Verb extends Translated {
  infinitive: string;
  /** ich, du, er/sie/es, wir, ihr, sie/Sie (from A2) */
  preterite?: string[];
  /** third person Perfekt, e.g. "hat gemacht" or "ist gegangen" (from A2) */
  perfect?: string;
  /** ich, du, er/sie/es, wir, ihr, sie/Sie */
  present: string[];
}

export type Tense = 'present' | 'preterite';

/** One verb in one person and tense, e.g. "du fährst" or "du fuhrst". */
export interface VerbForm {
  id: string;
  verb: Verb;
  person: number;
  tense: Tense;
}

/** A verb whose Perfekt is practised ("ich bin gefahren"). */
export interface PerfectRef {
  id: string;
  verb: Verb;
}

export interface GrammarItem extends Translated {
  /** sentence with one "___" gap, or (when the lesson has no gap) the prompt itself */
  q: string;
  a: string;
  /** overrides the lesson's options */
  options?: string[];
}

export interface GrammarLesson {
  id: string;
  title: Titled;
  emoji: string;
  rule: Titled;
  options: string[];
  /** shuffle options (e.g. whole sentences); otherwise they keep a fixed, learnable order */
  shuffle?: boolean;
  items: GrammarItem[];
}

export interface GrammarRef extends GrammarItem {
  id: string;
  lesson: GrammarLesson;
}

/** "What do you say?": a situation in the learner's language, answered with a German phrase. */
export interface PhraseItem extends Translated {
  situation: Translated;
  /** the right German phrase; en/es translate it */
  a: string;
  /** plausible German phrases that don't fit the situation */
  wrong: string[];
}

export interface PhraseLesson {
  id: string;
  title: Titled;
  emoji: string;
  items: PhraseItem[];
}

export interface PhraseRef extends PhraseItem {
  id: string;
  lesson: PhraseLesson;
}

/** One chapter of the course; links are topic ids, lesson ids (g-…, p-…) or pseudo-topics (verbs, numbers…). */
export interface Chapter {
  n: number;
  title: Titled;
  links: string[];
}

/*
 * Model tests in the format of the A1 exam "Start Deutsch 1": Hören, Lesen and Schreiben Teil 1 are
 * marked by the app, Schreiben Teil 2 and Sprechen by the learner (or their teacher).
 */

/** One line of a recording; speaker 2 gets a second voice. */
export interface ExamLine extends Titled {
  who?: 1 | 2;
}

/** A question in German. With `options` it is a/b/c and `a` is the right index; without, a richtig/falsch statement. */
export interface ExamQuestion extends Titled {
  options?: string[];
  a: number | boolean;
}

export interface ListeningItem extends ExamQuestion {
  audio: ExamLine[];
}

/** A note, an email, an article or a notice board; `head` holds lines like "Von: …" or "Betreff: …". */
export interface ExamText extends Titled {
  head?: string[];
}

/** An ad or web page (Lesen Teil 2): a heading, the text, and a footer such as a web address. */
export interface ExamAd extends Titled {
  title: string;
  foot?: string;
}

export interface ReadingText {
  text: ExamText;
  items: ExamQuestion[];
}

/** A situation and two ads; `a` is the index of the ad that fits. */
export interface AdChoice extends Titled {
  ads: [ExamAd, ExamAd];
  a: 0 | 1;
}

/** A sign or notice, where it hangs, and a richtig/falsch statement about it. */
export interface SignItem extends ExamQuestion {
  sign: Titled;
  where: Titled;
}

/** A field of a form: filled in already (`value`), a gap to write (`accepted`), or boxes to tick (`options`). */
export interface FormField extends Translated {
  /** the label on the form, in German; en/es translate it */
  label: string;
  value?: string;
  /** every answer that counts; the first is shown as the solution */
  accepted?: string[];
  options?: string[];
}

export interface WritingTask {
  /** the situation, in German */
  task: Titled;
  /** the three points the message has to cover */
  points: Titled[];
  model: Titled;
}

/** A question and an example answer. */
export interface QA {
  q: Titled;
  a: Titled;
}

/** Sprechen Teil 2: a word on a card, a question it could prompt, and an answer. */
export interface QuestionCard extends QA {
  word: string;
}

/** Sprechen Teil 3: a picture, a request it could prompt, and a reaction. */
export interface RequestCard {
  emoji: string;
  request: Titled;
  reply: Titled;
}

/** Start Deutsch 1 (A1). */
export interface Sd1Exam {
  format: 'sd1';
  /** "1", "2", …; the route is `exam-<id>` */
  id: string;
  hoeren: { teil1: ListeningItem[]; teil2: ListeningItem[]; teil3: ListeningItem[] };
  lesen: { teil1: ReadingText[]; teil2: AdChoice[]; teil3: SignItem[] };
  schreiben: {
    teil1: { text: Titled; title: string; fields: FormField[] };
    teil2: WritingTask;
  };
  sprechen: {
    /** a model introduction, then what the examiner asks you to spell and which number they ask for */
    teil1: { model: Titled; spell: QA; number: QA };
    teil2: { topic: Titled; cards: QuestionCard[] }[];
    teil3: RequestCard[];
  };
}

/** A picture to choose (Hören Teil 2 of A2): an emoji and a short German caption. */
export interface PictureOption extends Titled {
  emoji: string;
}

/** Something to match: a day, a person, a situation. `a` is the index of the picture or ad that fits, null for none. */
export interface MatchItem extends Titled {
  a: number | null;
}

/** An hour in a calendar (Sprechen Teil 3 of A2), with what is planned then. */
export interface CalendarSlot {
  time: string;
  entry?: Titled;
}

/** Goethe-Zertifikat A2. */
export interface A2Exam {
  format: 'a2';
  id: string;
  lesen: {
    /** a newspaper article, an information board, an email: five a/b/c questions each */
    teil1: ReadingText;
    teil2: ReadingText;
    teil3: ReadingText;
    /** six ads and five people; one person has no matching ad */
    teil4: { ads: ExamAd[]; items: MatchItem[] };
  };
  hoeren: {
    /** five short texts, heard twice */
    teil1: ListeningItem[];
    /** one conversation, heard once: which picture goes with each day (or person) */
    teil2: { audio: ExamLine[]; q: Titled; options: PictureOption[]; items: MatchItem[] };
    /** five short conversations, heard once */
    teil3: ListeningItem[];
    /** an interview, heard twice, with five Ja/Nein statements */
    teil4: { audio: ExamLine[]; items: ExamQuestion[] };
  };
  schreiben: { teil1: WritingTask; teil2: WritingTask };
  sprechen: {
    /** four cards to ask questions with ("Geburtstag?"), and four questions the partner asks */
    teil1: { cards: QuestionCard[]; partner: QA[] };
    /** a card with a question and four prompts; a model answer; a follow-up question */
    teil2: { q: Titled; prompts: string[]; model: Titled; followUp: QA };
    /** plan something together: the task, the learner's calendar, and the partner's lines with model replies */
    teil3: { task: Titled; day: string; calendar: CalendarSlot[]; turns: { partner: Titled; model: Titled }[] };
  };
}

export type ExamSet = Sd1Exam | A2Exam;

export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** What a level's content module exports. */
export type LevelContent = Omit<Level, 'id' | 'slug'>;

export interface Level {
  id: LevelId;
  slug: string;
  topics: Topic[];
  verbs: {
    /** column labels for the verb tables */
    pronouns: string[];
    /** pronouns a quiz prompt may show per person; "(note)" suffixes are shown as a hint, not spoken */
    prompts: string[][];
    verbs: Verb[];
  } | null;
  grammar: GrammarLesson[];
  phrases: PhraseLesson[];
  chapters: Chapter[];
  /** model tests in the level's exam format (A1: Start Deutsch 1, A2: Goethe-Zertifikat A2) */
  exams: ExamSet[];
}

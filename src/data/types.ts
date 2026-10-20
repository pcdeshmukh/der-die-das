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
  /** ich, du, er/sie/es, wir, ihr, sie/Sie */
  present: string[];
}

/** One verb in one person, e.g. "du fährst". */
export interface VerbForm {
  id: string;
  verb: Verb;
  person: number;
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

export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

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
}

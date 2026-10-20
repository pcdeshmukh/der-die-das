export type Article = 'der' | 'die' | 'das';
export const ARTICLES: Article[] = ['der', 'die', 'das'];

export interface Noun {
  de: string;
  article: Article;
  /** null when the noun has no (common) plural */
  plural: string | null;
  en: string;
  emoji?: string;
}

export interface Sentence {
  de: string;
  en: string;
  /** other word orders that are also correct */
  alt?: string[];
}

export interface Topic {
  id: string;
  title: { de: string; en: string };
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

export interface Verb {
  infinitive: string;
  en: string;
  /** ich, du, er/sie/es, wir, ihr, sie/Sie */
  present: string[];
}

/** One verb in one person, e.g. "du fährst". */
export interface VerbForm {
  id: string;
  verb: Verb;
  person: number;
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
}

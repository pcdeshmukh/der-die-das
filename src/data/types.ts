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

export interface Topic {
  id: string;
  title: { de: string; en: string };
  emoji: string;
  nouns: Noun[];
}

/** A noun with a stable id, used for progress tracking. */
export interface WordRef extends Noun {
  id: string;
  topic: string;
}

export type LevelId = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Level {
  id: LevelId;
  slug: string;
  topics: Topic[];
}

import { signal } from '@preact/signals';
import type { GrammarLesson, GrammarRef, Level, LevelContent, LevelId, PerfectRef, PhraseLesson, PhraseRef, Tense, SentenceRef, Topic, Verb, VerbForm, WordRef } from './types';

/**
 * Each level's content is its own chunk, fetched the first time the level is opened.
 * Levels without a loader are shown as "coming soon".
 */
const LOADERS: Partial<Record<LevelId, () => Promise<{ default: LevelContent }>>> = {
  A1: () => import('./a1'),
  A2: () => import('./a2'),
};

export interface LevelInfo {
  id: LevelId;
  slug: string;
  available: boolean;
}

export const LEVELS: LevelInfo[] = (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((id) => ({
  id,
  slug: id.toLowerCase(),
  available: id in LOADERS,
}));

export function levelInfo(slug: string): LevelInfo | undefined {
  return LEVELS.find((l) => l.slug === slug.toLowerCase());
}

/** Levels loaded so far; a signal so screens waiting on one re-render when it arrives. */
const loaded = signal<Partial<Record<LevelId, Level>>>({});
const pending = new Map<LevelId, Promise<Level>>();

/** The level's content if it has been loaded, else undefined (call loadLevel). */
export const getLevel = (id: LevelId): Level | undefined => loaded.value[id];

export function loadLevel(id: LevelId): Promise<Level> {
  let promise = pending.get(id);
  if (!promise) {
    const loader = LOADERS[id];
    if (!loader) return Promise.reject(new Error(`No content for level ${id}`));
    promise = loader().then(
      ({ default: content }) => {
        const level: Level = { id, slug: id.toLowerCase(), ...content };
        loaded.value = { ...loaded.value, [id]: level };
        return level;
      },
      (error) => {
        // Let a later visit try again, e.g. once back online.
        pending.delete(id);
        throw error;
      },
    );
    pending.set(id, promise);
  }
  return promise;
}

/** Every level with content, loaded (for tests). */
export const loadAllLevels = () => Promise.all(LEVELS.filter((l) => l.available).map((l) => loadLevel(l.id)));

const cache = new Map<string, WordRef[]>();

export function wordsOf(level: Level, topic: Topic): WordRef[] {
  const key = `${level.id}:${topic.id}`;
  let words = cache.get(key);
  if (!words) {
    words = topic.nouns.map((n) => ({ ...n, id: `${level.id}:${topic.id}:${n.de}`, topic: topic.id }));
    cache.set(key, words);
  }
  return words;
}

export function allWords(level: Level): WordRef[] {
  return level.topics.flatMap((t) => wordsOf(level, t));
}

export function sentencesOf(level: Level, topic: Topic): SentenceRef[] {
  return topic.sentences.map((s, i) => ({ ...s, id: `${level.id}:${topic.id}:s${i}`, topic: topic.id }));
}

export function allSentences(level: Level): SentenceRef[] {
  return level.topics.flatMap((t) => sentencesOf(level, t));
}

export function verbForms(level: Level, tense: Tense = 'present'): VerbForm[] {
  // Present ids keep their original shape so saved progress still matches.
  const suffix = tense === 'present' ? '' : `:${tense}`;
  return (level.verbs?.verbs ?? []).flatMap((verb: Verb) =>
    (verb[tense] ?? []).map((_, person) => ({
      id: `${level.id}:verb:${verb.infinitive}:${person}${suffix}`,
      verb,
      person,
      tense,
    })),
  );
}

export function perfectItems(level: Level): PerfectRef[] {
  return (level.verbs?.verbs ?? [])
    .filter((verb) => verb.perfect)
    .map((verb) => ({ id: `${level.id}:verb:${verb.infinitive}:perfect`, verb }));
}

export function grammarItems(level: Level, lesson: GrammarLesson): GrammarRef[] {
  return lesson.items.map((item, i) => ({ ...item, id: `${level.id}:grammar:${lesson.id}:${i}`, lesson }));
}

export function phraseItems(level: Level, lesson: PhraseLesson): PhraseRef[] {
  return lesson.items.map((item, i) => ({ ...item, id: `${level.id}:phrase:${lesson.id}:${i}`, lesson }));
}

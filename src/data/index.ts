import type { Level, LevelId, SentenceRef, Topic, Verb, VerbForm, WordRef } from './types';
import people from './a1/people.json';
import family from './a1/family.json';
import food from './a1/food.json';
import home from './a1/home.json';
import city from './a1/city.json';
import transport from './a1/transport.json';
import time from './a1/time.json';
import body from './a1/body.json';
import clothes from './a1/clothes.json';
import school from './a1/school.json';
import leisure from './a1/leisure.json';
import nature from './a1/nature.json';
import animals from './a1/animals.json';
import a1Verbs from './a1/verbs.json';

const A1 = [people, family, food, home, city, transport, time, body, clothes, school, leisure, nature, animals];

// Levels without topics are shown as "coming soon".
const TOPICS: Record<LevelId, Topic[]> = {
  A1: A1 as unknown as Topic[],
  A2: [],
  B1: [],
  B2: [],
  C1: [],
  C2: [],
};

const VERBS: Partial<Record<LevelId, Level['verbs']>> = { A1: a1Verbs };

export const LEVELS: Level[] = (Object.keys(TOPICS) as LevelId[]).map((id) => ({
  id,
  slug: id.toLowerCase(),
  topics: TOPICS[id],
  verbs: VERBS[id] ?? null,
}));

export function getLevel(slug: string): Level | undefined {
  return LEVELS.find((l) => l.slug === slug.toLowerCase());
}

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

export function verbForms(level: Level): VerbForm[] {
  return (level.verbs?.verbs ?? []).flatMap((verb: Verb) =>
    verb.present.map((_, person) => ({ id: `${level.id}:verb:${verb.infinitive}:${person}`, verb, person })),
  );
}

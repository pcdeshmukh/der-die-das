import type { Chapter, GrammarLesson, GrammarRef, Level, LevelId, PerfectRef, PhraseLesson, PhraseRef, Tense, SentenceRef, Topic, Verb, VerbForm, WordRef } from './types';
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
import jobs from './a1/jobs.json';
import things from './a1/things.json';
import office from './a1/office.json';
import appliances from './a1/appliances.json';
import festivals from './a1/festivals.json';
import environment from './a1/environment.json';
import a1Verbs from './a1/verbs.json';
import a1Grammar from './a1/grammar.json';
import a1GrammarCh01 from './a1/grammar-ch01-06.json';
import a1GrammarCh07 from './a1/grammar-ch07-12.json';
import a1GrammarCh13 from './a1/grammar-ch13-19.json';
import a1GrammarCh20 from './a1/grammar-ch20-24.json';
import a1PhrasesCh01 from './a1/phrases-ch01-12.json';
import a1PhrasesCh13 from './a1/phrases-ch13-24.json';
import a1Chapters from './a1/chapters.json';
import a2Relatives from './a2/relatives.json';
import a2Moving from './a2/moving.json';
import a2Cooking from './a2/cooking.json';
import a2Health from './a2/health.json';
import a2Work from './a2/work.json';
import a2Media from './a2/media.json';
import a2Travel from './a2/travel.json';
import a2Money from './a2/money.json';
import a2Authorities from './a2/authorities.json';
import a2Culture from './a2/culture.json';
import a2Feelings from './a2/feelings.json';
import a2Tech from './a2/tech.json';
import a2Verbs from './a2/verbs.json';
import a2GrammarCh01 from './a2/grammar-ch01-06.json';
import a2GrammarCh07 from './a2/grammar-ch07-14.json';
import a2GrammarCh15 from './a2/grammar-ch15-24.json';
import a2PhrasesCh01 from './a2/phrases-ch01-12.json';
import a2PhrasesCh13 from './a2/phrases-ch13-24.json';
import a2Chapters from './a2/chapters.json';

const A1 = [
  people,
  family,
  jobs,
  food,
  home,
  appliances,
  things,
  office,
  city,
  transport,
  environment,
  time,
  body,
  clothes,
  school,
  leisure,
  festivals,
  nature,
  animals,
];

const A2 = [
  a2Relatives,
  a2Moving,
  a2Cooking,
  a2Health,
  a2Work,
  a2Media,
  a2Travel,
  a2Money,
  a2Authorities,
  a2Culture,
  a2Feelings,
  a2Tech,
];

// Levels without topics are shown as "coming soon".
const TOPICS: Record<LevelId, Topic[]> = {
  A1: A1 as unknown as Topic[],
  A2: A2 as unknown as Topic[],
  B1: [],
  B2: [],
  C1: [],
  C2: [],
};

const VERBS: Partial<Record<LevelId, Level['verbs']>> = { A1: a1Verbs, A2: a2Verbs as Level['verbs'] };
const GRAMMAR: Partial<Record<LevelId, GrammarLesson[]>> = {
  A1: [...a1Grammar, ...a1GrammarCh01, ...a1GrammarCh07, ...a1GrammarCh13, ...a1GrammarCh20] as GrammarLesson[],
  A2: [...a2GrammarCh01, ...a2GrammarCh07, ...a2GrammarCh15] as GrammarLesson[],
};
const CHAPTERS: Partial<Record<LevelId, Chapter[]>> = { A1: a1Chapters, A2: a2Chapters };
const PHRASES: Partial<Record<LevelId, PhraseLesson[]>> = {
  A1: [...a1PhrasesCh01, ...a1PhrasesCh13] as unknown as PhraseLesson[],
  A2: [...a2PhrasesCh01, ...a2PhrasesCh13] as unknown as PhraseLesson[],
};

export const LEVELS: Level[] = (Object.keys(TOPICS) as LevelId[]).map((id) => ({
  id,
  slug: id.toLowerCase(),
  topics: TOPICS[id],
  verbs: VERBS[id] ?? null,
  grammar: GRAMMAR[id] ?? [],
  phrases: PHRASES[id] ?? [],
  chapters: CHAPTERS[id] ?? [],
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

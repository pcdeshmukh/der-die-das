import { allSentences, allWords, grammarItems, perfectItems, phraseItems, sentencesOf, verbForms, wordsOf } from '../data';
import type { Level } from '../data/types';
import { t, uiLang } from './i18n';
import { speechSupported } from './speech';
import { weakWords, type Skill, type WordStat } from './srs';

export type ModeId =
  | 'articles'
  | 'match'
  | 'plural'
  | 'listen'
  | 'sentences'
  | 'conjugate'
  | 'preterite'
  | 'perfect'
  | 'numbers'
  | 'time'
  | 'grammar'
  | 'phrases'
  | 'alphabet';

/** Which kind of screen a mode belongs to. */
export type Section = 'vocab' | 'verbs' | 'numbers' | 'grammar' | 'phrases' | 'alphabet';

export interface Mode {
  id: ModeId;
  section: Section;
  /** progress-tracked skill; null for generated questions (numbers, time, alphabet) */
  skill: Skill | null;
  icon: string;
  /** minimum items needed to play */
  min: number;
  needsSpeech?: boolean;
}

export const MODES: Mode[] = [
  { id: 'articles', section: 'vocab', skill: 'article', icon: '🎯', min: 1 },
  { id: 'match', section: 'vocab', skill: 'meaning', icon: '🧩', min: 3 },
  { id: 'plural', section: 'vocab', skill: 'plural', icon: '👯', min: 1 },
  { id: 'listen', section: 'vocab', skill: 'listening', icon: '👂', min: 1, needsSpeech: true },
  { id: 'sentences', section: 'vocab', skill: 'sentence', icon: '🧱', min: 1 },
  { id: 'conjugate', section: 'verbs', skill: 'conjugation', icon: '🔤', min: 1 },
  { id: 'preterite', section: 'verbs', skill: 'preterite', icon: '⏪', min: 1 },
  { id: 'perfect', section: 'verbs', skill: 'perfect', icon: '✅', min: 1 },
  { id: 'numbers', section: 'numbers', skill: null, icon: '🔢', min: 0 },
  { id: 'time', section: 'numbers', skill: null, icon: '🕒', min: 0 },
  { id: 'grammar', section: 'grammar', skill: 'grammar', icon: '✏️', min: 1 },
  { id: 'phrases', section: 'phrases', skill: 'phrases', icon: '💬', min: 1 },
  { id: 'alphabet', section: 'alphabet', skill: null, icon: '🔡', min: 0, needsSpeech: true },
];

/** Pseudo-topics shown alongside the real ones. */
export const MIXED = 'mixed';
export const REVIEW = 'review';
export const VERBS = 'verbs';
export const NUMBERS = 'numbers';
export const ALPHABET = 'alphabet';
/** Lessons are pseudo-topics named `g-<grammar lesson id>` and `p-<phrase set id>`. */
export const GRAMMAR_PREFIX = 'g-';
export const PHRASE_PREFIX = 'p-';

export function grammarLesson(level: Level, topicId: string) {
  return topicId.startsWith(GRAMMAR_PREFIX)
    ? level.grammar.find((l) => l.id === topicId.slice(GRAMMAR_PREFIX.length))
    : undefined;
}

export function phraseLesson(level: Level, topicId: string) {
  return topicId.startsWith(PHRASE_PREFIX)
    ? level.phrases.find((l) => l.id === topicId.slice(PHRASE_PREFIX.length))
    : undefined;
}

export type Item = { id: string };

function itemsOf(level: Level, mode: Mode, topicId: string | null): Item[] {
  const topic = topicId ? level.topics.find((t) => t.id === topicId) : undefined;
  switch (mode.id) {
    case 'sentences':
      return topic ? sentencesOf(level, topic) : allSentences(level);
    case 'conjugate':
      return verbForms(level);
    case 'preterite':
      return verbForms(level, 'preterite');
    case 'perfect':
      return perfectItems(level);
    case 'numbers':
    case 'time':
    case 'alphabet':
      return [];
    case 'grammar': {
      const lesson = topicId ? grammarLesson(level, topicId) : undefined;
      return lesson ? grammarItems(level, lesson) : level.grammar.flatMap((l) => grammarItems(level, l));
    }
    case 'phrases': {
      const lesson = topicId ? phraseLesson(level, topicId) : undefined;
      return lesson ? phraseItems(level, lesson) : level.phrases.flatMap((l) => phraseItems(level, l));
    }
    default: {
      const words = topic ? wordsOf(level, topic) : allWords(level);
      return mode.id === 'plural' ? words.filter((w) => w.plural) : words;
    }
  }
}

const inSection = (section: Section) => MODES.filter((m) => m.section === section);

/** Modes offered on a topic or pseudo-topic screen. */
export function modesFor(level: Level, topicId: string): Mode[] {
  if (topicId === VERBS) {
    // Past tenses appear once a level's verb data has them (A2 on).
    const verbs = level.verbs?.verbs ?? [];
    return inSection('verbs').filter(
      (m) =>
        verbs.length > 0 &&
        (m.id === 'conjugate' || (m.id === 'preterite' ? verbs.some((v) => v.preterite) : verbs.some((v) => v.perfect))),
    );
  }
  if (topicId === NUMBERS) return inSection('numbers');
  if (topicId === ALPHABET) return level.id === 'A1' ? inSection('alphabet') : [];
  if (grammarLesson(level, topicId)) return inSection('grammar');
  if (phraseLesson(level, topicId)) return inSection('phrases');
  if (topicId === REVIEW) return MODES.filter((m) => m.skill);
  if (topicId === MIXED || level.topics.some((t) => t.id === topicId)) return inSection('vocab');
  return [];
}

/** The items a round draws from, or null if the mode doesn't exist on this screen. */
export function poolFor(level: Level, topicId: string, mode: Mode, stats: Record<string, WordStat>): Item[] | null {
  if (!modesFor(level, topicId).includes(mode)) return null;
  if (topicId === REVIEW) return weakWords(itemsOf(level, mode, null), stats, mode.skill!);
  const real =
    level.topics.some((t) => t.id === topicId) || !!grammarLesson(level, topicId) || !!phraseLesson(level, topicId);
  return itemsOf(level, mode, real ? topicId : null);
}

export function isPlayable(mode: Mode, pool: Item[]): boolean {
  return pool.length >= mode.min && (!mode.needsSpeech || speechSupported);
}

export const starKey = (level: Level, topicId: string, mode: ModeId) =>
  topicId === REVIEW ? null : `${level.id}/${topicId}/${mode}`;

export type TopicKind = 'vocab' | 'grammar' | 'phrases' | 'skill' | 'practice';

export interface TopicInfo {
  id: string;
  kind: TopicKind;
  title: string;
  /** the German title, for learners using English or Spanish menus */
  titleDe?: string;
  emoji: string;
}

/** Title, emoji and kind of anything a route or chapter can point at. */
export function describeTopic(level: Level, id: string): TopicInfo | null {
  const lang = uiLang();
  const topic = level.topics.find((x) => x.id === id);
  if (topic) return { id, kind: 'vocab', title: topic.title[lang], titleDe: topic.title.de, emoji: topic.emoji };
  const lesson = grammarLesson(level, id) ?? phraseLesson(level, id);
  if (lesson) {
    const kind = id.startsWith(GRAMMAR_PREFIX) ? 'grammar' : 'phrases';
    return { id, kind, title: lesson.title[lang], titleDe: lesson.title.de, emoji: lesson.emoji };
  }
  const pseudo = {
    [MIXED]: { kind: 'practice', title: t('mixed'), emoji: '🎲' },
    [REVIEW]: { kind: 'practice', title: t('review'), emoji: '🔁' },
    [VERBS]: { kind: 'skill', title: t('verbs'), emoji: '🔤' },
    [NUMBERS]: { kind: 'skill', title: t('numbersTopic'), emoji: '🔢' },
    [ALPHABET]: { kind: 'skill', title: t('alphabet'), emoji: '🔡' },
  } as const;
  const p = pseudo[id as keyof typeof pseudo];
  return p && modesFor(level, id).length ? { id, ...p } : null;
}

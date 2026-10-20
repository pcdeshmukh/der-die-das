import { allSentences, allWords, grammarItems, sentencesOf, verbForms, wordsOf } from '../data';
import type { Level } from '../data/types';
import { speechSupported } from './speech';
import { weakWords, type Skill, type WordStat } from './srs';

export type ModeId = 'articles' | 'match' | 'plural' | 'listen' | 'sentences' | 'conjugate' | 'numbers' | 'time' | 'grammar';

/** Which kind of screen a mode belongs to. */
export type Section = 'vocab' | 'verbs' | 'numbers' | 'grammar';

export interface Mode {
  id: ModeId;
  section: Section;
  /** progress-tracked skill; null for generated questions (numbers, time) */
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
  { id: 'numbers', section: 'numbers', skill: null, icon: '🔢', min: 0 },
  { id: 'time', section: 'numbers', skill: null, icon: '🕒', min: 0 },
  { id: 'grammar', section: 'grammar', skill: 'grammar', icon: '✏️', min: 1 },
];

/** Pseudo-topics shown alongside the real ones. */
export const MIXED = 'mixed';
export const REVIEW = 'review';
export const VERBS = 'verbs';
export const NUMBERS = 'numbers';
/** Grammar lessons are pseudo-topics named `g-<lesson id>`. */
export const GRAMMAR_PREFIX = 'g-';

export function grammarLesson(level: Level, topicId: string) {
  return topicId.startsWith(GRAMMAR_PREFIX)
    ? level.grammar.find((l) => l.id === topicId.slice(GRAMMAR_PREFIX.length))
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
    case 'numbers':
    case 'time':
      return [];
    case 'grammar': {
      const lesson = topicId ? grammarLesson(level, topicId) : undefined;
      return lesson ? grammarItems(level, lesson) : level.grammar.flatMap((l) => grammarItems(level, l));
    }
    default: {
      const words = topic ? wordsOf(level, topic) : allWords(level);
      return mode.id === 'plural' ? words.filter((w) => w.plural) : words;
    }
  }
}

/** Modes offered on a topic or pseudo-topic screen. */
export function modesFor(level: Level, topicId: string): Mode[] {
  if (topicId === VERBS) return level.verbs ? MODES.filter((m) => m.section === 'verbs') : [];
  if (topicId === NUMBERS) return MODES.filter((m) => m.section === 'numbers');
  if (grammarLesson(level, topicId)) return MODES.filter((m) => m.section === 'grammar');
  if (topicId === REVIEW) return MODES.filter((m) => m.skill && m.section !== 'numbers');
  if (topicId === MIXED || level.topics.some((t) => t.id === topicId)) return MODES.filter((m) => m.section === 'vocab');
  return [];
}

/** The items a round draws from, or null if the mode doesn't exist on this screen. */
export function poolFor(level: Level, topicId: string, mode: Mode, stats: Record<string, WordStat>): Item[] | null {
  if (!modesFor(level, topicId).includes(mode)) return null;
  if (topicId === REVIEW) return weakWords(itemsOf(level, mode, null), stats, mode.skill!);
  const real = level.topics.some((t) => t.id === topicId) || !!grammarLesson(level, topicId);
  return itemsOf(level, mode, real ? topicId : null);
}

export function isPlayable(mode: Mode, pool: Item[]): boolean {
  return pool.length >= mode.min && (!mode.needsSpeech || speechSupported);
}

export const starKey = (level: Level, topicId: string, mode: ModeId) =>
  topicId === REVIEW ? null : `${level.id}/${topicId}/${mode}`;

import { allSentences, allWords, sentencesOf, verbForms, wordsOf } from '../data';
import type { Level } from '../data/types';
import { speechSupported } from './speech';
import { weakWords, type Skill, type WordStat } from './srs';

export type ModeId = 'articles' | 'match' | 'plural' | 'listen' | 'sentences' | 'conjugate' | 'numbers' | 'time';

/** Which kind of screen a mode belongs to. */
export type Section = 'vocab' | 'verbs' | 'numbers';

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
];

/** Pseudo-topics shown alongside the real ones. */
export const MIXED = 'mixed';
export const REVIEW = 'review';
export const VERBS = 'verbs';
export const NUMBERS = 'numbers';

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
  if (topicId === REVIEW) return MODES.filter((m) => m.skill && m.section !== 'numbers');
  if (topicId === MIXED || level.topics.some((t) => t.id === topicId)) return MODES.filter((m) => m.section === 'vocab');
  return [];
}

/** The items a round draws from, or null if the mode doesn't exist on this screen. */
export function poolFor(level: Level, topicId: string, mode: Mode, stats: Record<string, WordStat>): Item[] | null {
  if (!modesFor(level, topicId).includes(mode)) return null;
  if (topicId === REVIEW) return weakWords(itemsOf(level, mode, null), stats, mode.skill!);
  const real = level.topics.some((t) => t.id === topicId);
  return itemsOf(level, mode, real ? topicId : null);
}

export function isPlayable(mode: Mode, pool: Item[]): boolean {
  return pool.length >= mode.min && (!mode.needsSpeech || speechSupported);
}

export const starKey = (level: Level, topicId: string, mode: ModeId) =>
  topicId === REVIEW ? null : `${level.id}/${topicId}/${mode}`;

import { allWords, wordsOf } from '../data';
import type { Level, WordRef } from '../data/types';
import { weakWords, type Skill, type WordStat } from './srs';

export type ModeId = 'articles' | 'match';

export interface Mode {
  id: ModeId;
  skill: Skill;
  icon: string;
  /** minimum words needed to play */
  min: number;
}

export const MODES: Mode[] = [
  { id: 'articles', skill: 'article', icon: '🎯', min: 1 },
  { id: 'match', skill: 'meaning', icon: '🧩', min: 3 },
];

/** Pseudo-topics shown alongside the real ones. */
export const MIXED = 'mixed';
export const REVIEW = 'review';

export function poolFor(level: Level, topicId: string, skill: Skill, stats: Record<string, WordStat>): WordRef[] | null {
  if (topicId === MIXED) return allWords(level);
  if (topicId === REVIEW) return weakWords(allWords(level), stats, skill);
  const topic = level.topics.find((t) => t.id === topicId);
  return topic ? wordsOf(level, topic) : null;
}

export const starKey = (level: Level, topicId: string, mode: ModeId) =>
  topicId === REVIEW ? null : `${level.id}/${topicId}/${mode}`;

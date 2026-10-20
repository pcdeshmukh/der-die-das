// Leitner-style spaced repetition: a correct answer moves a word up one box
// (longer wait before it is due again), a wrong answer sends it back to box 0.
import { shuffle } from './random';

export type Skill = 'article' | 'meaning' | 'plural' | 'listening' | 'sentence' | 'conjugation' | 'grammar' | 'phrases';

type Item = { id: string };

export interface WordStat {
  box: number;
  due: number;
  seen: number;
  correct: number;
}

const DAY = 86_400_000;
export const INTERVALS = [0, 1, 2, 4, 8, 16].map((d) => d * DAY);

export const statKey = (skill: Skill, id: string) => `${skill}|${id}`;

export function review(stat: WordStat | undefined, correct: boolean, now = Date.now()): WordStat {
  const s = stat ?? { box: 0, due: now, seen: 0, correct: 0 };
  const box = correct ? Math.min(s.box + 1, INTERVALS.length - 1) : 0;
  return { box, due: now + INTERVALS[box], seen: s.seen + 1, correct: s.correct + (correct ? 1 : 0) };
}

/** Picks `count` words: due words first (weakest first), then unseen, then the rest by due date. */
export function pickWords<T extends Item>(
  words: readonly T[],
  stats: Record<string, WordStat>,
  skill: Skill,
  count: number,
  now = Date.now(),
): T[] {
  const ranked = shuffle(words).map((w) => {
    const s = stats[statKey(skill, w.id)];
    return { w, s, rank: !s ? 1 : s.due <= now ? 0 : 2 };
  });
  ranked.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.rank === 0) return a.s!.box - b.s!.box;
    if (a.rank === 2) return a.s!.due - b.s!.due;
    return 0;
  });
  return shuffle(ranked.slice(0, count).map((r) => r.w));
}

/** Items whose most recent answer was wrong. */
export function weakWords<T extends Item>(words: readonly T[], stats: Record<string, WordStat>, skill: Skill): T[] {
  return words.filter((w) => {
    const s = stats[statKey(skill, w.id)];
    return s !== undefined && s.box === 0 && s.seen > 0;
  });
}

export function starsFor(correct: number, total: number): number {
  const ratio = total ? correct / total : 0;
  return ratio >= 0.9 ? 3 : ratio >= 0.75 ? 2 : ratio >= 0.5 ? 1 : 0;
}

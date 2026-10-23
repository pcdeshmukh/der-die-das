import type { GrammarRef, Level, PerfectRef, PhraseRef, VerbForm, WordRef } from '../data/types';
import { MODES, REVIEW, poolFor, type ModeId } from '../lib/modes';
import { shuffle, withSeed } from '../lib/random';
import { href } from '../lib/router';
import { articleQuestion } from './ArticleGame';
import type { ChoiceLayout, ChoiceQuestion } from './ChoiceGame';
import { conjugationQuestion } from './ConjugationGame';
import { grammarQuestion } from './GrammarGame';
import { numberQuestion } from './NumbersGame';
import { perfectQuestion } from './PerfectGame';
import { phraseQuestion } from './PhraseGame';
import { pluralQuestion } from './PluralGame';
import { formalTimeQuestion, informalTimeQuestion } from './TimeGame';

/**
 * A challenge is a round anyone can replay from a link: the seed fixes the questions, so a
 * friend gets exactly the same ones, and the link carries the challenger's name, score and time.
 * No server is involved.
 */
export const CHALLENGE_SIZE = 10;

/** Games whose questions come only from content and the seed (no speech, no own interaction). */
const BUILDERS: Partial<Record<ModeId, (level: Level, items: unknown[]) => ChoiceQuestion[]>> = {
  articles: (_, items) => (items as WordRef[]).map((w) => articleQuestion(w)),
  plural: (_, items) => (items as WordRef[]).map(pluralQuestion),
  conjugate: (level, items) => (items as VerbForm[]).map((f) => conjugationQuestion(level, f)),
  preterite: (level, items) => (items as VerbForm[]).map((f) => conjugationQuestion(level, f)),
  perfect: (level, items) => (items as PerfectRef[]).map((x) => perfectQuestion(level, x)),
  grammar: (_, items) => (items as GrammarRef[]).map(grammarQuestion),
  phrases: (_, items) => (items as PhraseRef[]).map(phraseQuestion),
  // Generated questions; listening ones are left out so every device gets the same round.
  numbers: () => Array.from({ length: CHALLENGE_SIZE }, (_, i) => numberQuestion(i, i % 2 ? 'toWord' : 'toDigits')),
  time: () =>
    Array.from({ length: CHALLENGE_SIZE }, (_, i) => (i % 5 < 3 ? informalTimeQuestion(i) : formalTimeQuestion(i))),
};

export const LAYOUT: Partial<Record<ModeId, ChoiceLayout>> = { perfect: 'list', time: 'list', phrases: 'list' };

export const canChallenge = (topicId: string, modeId: string) => topicId !== REVIEW && modeId in BUILDERS;

/** Short random id for a new challenge; not part of any seeded sequence. */
export const newSeed = () => Math.random().toString(36).slice(2, 8);

/** The challenge's questions, identical on every device; null if the link doesn't fit this content. */
export function challengeQuestions(level: Level, topicId: string, modeId: string, seed: string): ChoiceQuestion[] | null {
  const mode = MODES.find((m) => m.id === modeId);
  const build = mode && canChallenge(topicId, mode.id) ? BUILDERS[mode.id] : undefined;
  // Empty stats: picking must not depend on the player's own spaced-repetition history.
  const pool = mode && poolFor(level, topicId, mode, {});
  if (!build || !pool || pool.length < mode.min) return null;
  return withSeed(`challenge:${level.id}:${topicId}:${modeId}:${seed}`, () =>
    shuffle(build(level, shuffle(pool).slice(0, CHALLENGE_SIZE))),
  );
}

export interface ChallengeResult {
  name: string;
  correct: number;
  total: number;
  seconds: number;
}

const ANONYMOUS = '~';

/** `#/challenge/<level>/<topic>/<mode>/<seed>[/<name>/<correct>/<total>/<seconds>]` */
export function challengeHref(level: Level, topicId: string, modeId: string, seed: string, result?: ChallengeResult) {
  const parts = ['challenge', level.slug, topicId, modeId, seed];
  if (result) parts.push(result.name.trim() || ANONYMOUS, String(result.correct), String(result.total), String(result.seconds));
  return href(...parts);
}

/** The challenger's result from the link's tail, if it has a valid one. */
export function parseResult(tail: string[]): ChallengeResult | null {
  const [name, correct, total, seconds] = tail;
  const nums = [correct, total, seconds].map(Number);
  if (!name || nums.some((n) => !Number.isInteger(n) || n < 0) || nums[0] > nums[1]) return null;
  return { name: name === ANONYMOUS ? '' : name, correct: nums[0], total: nums[1], seconds: nums[2] };
}

/** More correct answers wins; on a tie, the faster time. */
export function compare(mine: ChallengeResult, theirs: ChallengeResult): 'win' | 'lose' | 'draw' {
  if (mine.correct !== theirs.correct) return mine.correct > theirs.correct ? 'win' : 'lose';
  if (mine.seconds !== theirs.seconds) return mine.seconds < theirs.seconds ? 'win' : 'lose';
  return 'draw';
}

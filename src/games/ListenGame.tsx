import { useState } from 'preact/hooks';
import { NounLabel } from '../components/NounLabel';
import { speak } from '../lib/speech';
import { allWords } from '../data';
import type { WordRef } from '../data/types';
import { meaning, t } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 12;
const say = (w: WordRef) => `${w.article} ${w.de}`;

/** Three words that look or sound a bit like `w`, so the player has to really listen. */
function distractors(w: WordRef, candidates: WordRef[]): WordRef[] {
  const scored = shuffle(candidates.filter((c) => c.de !== w.de)).map((c) => ({
    c,
    score: (c.de[0] === w.de[0] ? 2 : 0) + (Math.abs(c.de.length - w.de.length) <= 2 ? 1 : 0) + Math.random(),
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.c);
}

export function ListenGame({ level, pool, starKey, onRetry, onExit }: GameProps<WordRef>) {
  const [questions] = useState(() => {
    const candidates = allWords(level);
    return pickWords(pool, progress.peek().words, 'listening', Math.min(ROUND_SIZE, pool.length)).map(
      (w): ChoiceQuestion => ({
        key: w.id,
        statId: w.id,
        prompt: (answered) => (
          <>
            <button class="listen-btn" onClick={() => speak(say(w), true)} aria-label={t('play')}>
              {answered ? (w.emoji ?? '🔊') : '🔊'}
            </button>
            <div class="noun-hint">{answered ? meaning(w) : t('listenPrompt')}</div>
          </>
        ),
        options: shuffle([w, ...distractors(w, candidates)]).map(say),
        answer: say(w),
        sayFirst: say(w),
        solution: <NounLabel noun={w} />,
        review: { label: <NounLabel noun={w} />, sub: meaning(w), emoji: w.emoji, say: say(w) },
      }),
    );
  });
  return <ChoiceGame questions={questions} skill="listening" starKey={starKey} layout="grid" onRetry={onRetry} onExit={onExit} />;
}

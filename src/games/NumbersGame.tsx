import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import { numberToGerman } from '../lib/german';
import { t } from '../lib/i18n';
import { randInt, random, shuffle } from '../lib/random';
import { speak, speechSupported } from '../lib/speech';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 10;

/** Mostly 0–99, with some hundreds (prices, house numbers). */
function randomNumber(): number {
  const r = random();
  return r < 0.3 ? randInt(0, 20) : r < 0.85 ? randInt(21, 99) : randInt(100, 999);
}

/** Close calls: swapped digits (47 ↔ 74) are the classic German trap. */
function nearby(n: number): number[] {
  const s = String(n);
  const swapped = s.length === 2 ? Number(s[1] + s[0]) : s.length === 3 ? Number(s[0] + s[2] + s[1]) : n;
  const pool = [swapped, n + 1, n - 1, n + 10, n - 10, n + 100, randomNumber()];
  return [...new Set(pool.filter((x) => x >= 0 && x <= 999 && x !== n))];
}

export type NumberKind = 'toWord' | 'toDigits' | 'listen';

export function numberQuestion(i: number, kind: NumberKind): ChoiceQuestion {
  const n = randomNumber();
  const word = numberToGerman(n);
  const [closest, ...rest] = nearby(n);
  const others = [closest, ...shuffle(rest).slice(0, 2)];
  const asWords = kind === 'toWord';
  const options = shuffle([n, ...others]).map((x) => (asWords ? numberToGerman(x) : String(x)));
  return {
    key: `${i}:${n}`,
    prompt: (answered) => (
      <>
        {kind === 'listen' ? (
          <button class="listen-btn" onClick={() => speak(word, true)} aria-label={t('play')}>
            {answered ? n : '🔊'}
          </button>
        ) : (
          <div class={kind === 'toWord' ? 'big-number' : 'noun-word'}>{kind === 'toWord' ? n : word}</div>
        )}
        <div class="noun-hint">
          {kind === 'listen' ? (answered ? word : t('listenPrompt')) : kind === 'toWord' ? t('howSay') : t('whichNumber')}
        </div>
        {kind !== 'listen' && <SpeakButton text={word} />}
      </>
    ),
    options,
    answer: asWords ? word : String(n),
    sayFirst: kind === 'listen' ? word : undefined,
    sayAfter: kind === 'listen' ? undefined : word,
    solution: <b>{asWords ? word : n}</b>,
    review: { label: <b>{n}</b>, sub: word, say: word },
  };
}

export function NumbersGame({ starKey, onRetry, onExit }: GameProps) {
  const [questions] = useState(() => {
    const kinds: NumberKind[] = speechSupported ? ['toWord', 'toDigits', 'listen'] : ['toWord', 'toDigits'];
    return shuffle(Array.from({ length: ROUND_SIZE }, (_, i) => numberQuestion(i, kinds[i % kinds.length])));
  });
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}

import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import { formatNumber, numberToGerman } from '../lib/german';
import { t } from '../lib/i18n';
import { randInt, random, shuffle } from '../lib/random';
import { speak, speechSupported } from '../lib/speech';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 10;

/** Mostly 0–99, then hundreds (house numbers) and thousands (prices, cities) up to a million. */
function randomNumber(): number {
  const r = random();
  if (r < 0.25) return randInt(0, 20);
  if (r < 0.65) return randInt(21, 99);
  if (r < 0.8) return randInt(100, 999);
  if (r < 0.95) return randInt(1, 99) * 100 + (random() < 0.5 ? 0 : randInt(1, 99));
  return random() < 0.2 ? 1_000_000 : randInt(1, 999) * 1000;
}

/** Close calls: swapped digits (47 ↔ 74) are the classic German trap; big numbers get place-value slips. */
function nearby(n: number): number[] {
  const s = String(n);
  const swapped = s.length >= 2 ? Number(s.slice(0, -2) + s.at(-1) + s.at(-2)) : n;
  const step = n >= 10_000 ? 1000 : n >= 1000 ? 100 : 10;
  const pool = [swapped, n + 1, n - 1, n + step, n - step, n * 10, Math.floor(n / 10), randomNumber()];
  return [...new Set(pool.filter((x) => x >= 0 && x <= 1_000_000 && x !== n))];
}

export type NumberKind = 'toWord' | 'toDigits' | 'listen';

export function numberQuestion(i: number, kind: NumberKind): ChoiceQuestion {
  const n = randomNumber();
  const word = numberToGerman(n);
  const [closest, ...rest] = nearby(n);
  const others = [closest, ...shuffle(rest).slice(0, 2)];
  const asWords = kind === 'toWord';
  const options = shuffle([n, ...others]).map((x) => (asWords ? numberToGerman(x) : formatNumber(x)));
  return {
    key: `${i}:${n}`,
    prompt: (answered) => (
      <>
        {kind === 'listen' ? (
          <button class="listen-btn" onClick={() => speak(word, true)} aria-label={t('play')}>
            {answered ? formatNumber(n) : '🔊'}
          </button>
        ) : (
          <div class={kind === 'toWord' ? 'big-number' : 'noun-word'}>{kind === 'toWord' ? formatNumber(n) : word}</div>
        )}
        <div class="noun-hint">
          {kind === 'listen' ? (answered ? word : t('listenPrompt')) : kind === 'toWord' ? t('howSay') : t('whichNumber')}
        </div>
        {kind !== 'listen' && <SpeakButton text={word} />}
      </>
    ),
    options,
    answer: asWords ? word : formatNumber(n),
    sayFirst: kind === 'listen' ? word : undefined,
    sayAfter: kind === 'listen' ? undefined : word,
    solution: <b>{asWords ? word : formatNumber(n)}</b>,
    review: { label: <b>{formatNumber(n)}</b>, sub: word, say: word },
  };
}

export function NumbersGame({ starKey, onRetry, onExit }: GameProps) {
  const [questions] = useState(() => {
    const kinds: NumberKind[] = speechSupported ? ['toWord', 'toDigits', 'listen'] : ['toWord', 'toDigits'];
    return shuffle(Array.from({ length: ROUND_SIZE }, (_, i) => numberQuestion(i, kinds[i % kinds.length])));
  });
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}

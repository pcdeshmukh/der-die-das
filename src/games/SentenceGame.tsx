import { useEffect, useState } from 'preact/hooks';
import { GameBar } from '../components/GameBar';
import { SpeakButton } from '../components/NounPrompt';
import { Results } from '../components/Results';
import type { SentenceRef } from '../data/types';
import { meaning, t } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { speak } from '../lib/speech';
import { pickWords, starsFor } from '../lib/srs';
import { finishRound, progress, recordAnswer } from '../lib/store';
import type { GameProps } from './types';

const ROUND_SIZE = 8;

/** "Wo ist der Bahnhof?" → words ["Wo", "ist", "der", "Bahnhof"] and end mark "?". */
export function splitSentence(sentence: string): { words: string[]; end: string } {
  const end = sentence.match(/[.?!]+$/)?.[0] ?? '';
  return { words: sentence.slice(0, sentence.length - end.length).split(' '), end };
}

interface Puzzle {
  s: SentenceRef;
  words: string[];
  end: string;
  /** tile order in the bank: indices into `words` */
  bank: number[];
}

function makePuzzle(s: SentenceRef): Puzzle {
  const { words, end } = splitSentence(s.de);
  let bank = shuffle(words.map((_, i) => i));
  // Never hand out the answer already in order.
  for (let tries = 0; tries < 5 && words.length > 1 && bank.every((v, i) => words[v] === words[i]); tries++) {
    bank = shuffle(bank);
  }
  return { s, words, end, bank };
}

function isCorrect(p: Puzzle, placed: number[]): boolean {
  const built = placed.map((i) => p.words[i]).join(' ');
  return [p.s.de, ...(p.s.alt ?? [])].some((ok) => splitSentence(ok).words.join(' ') === built);
}

export function SentenceGame({ pool, starKey, onRetry, onExit }: GameProps<SentenceRef>) {
  const [puzzles] = useState(() =>
    pickWords(pool, progress.peek().words, 'sentence', Math.min(ROUND_SIZE, pool.length)).map(makePuzzle),
  );
  const [index, setIndex] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [xp, setXp] = useState(0);
  const [done, setDone] = useState(false);

  const p = puzzles[index];
  const full = placed.length === p.words.length;

  function place(i: number) {
    if (result === null) setPlaced((prev) => (prev.includes(i) ? prev : [...prev, i]));
  }

  function unplace(i: number) {
    if (result === null) setPlaced((prev) => prev.filter((x) => x !== i));
  }

  function check() {
    if (!full || result !== null) return;
    const ok = isCorrect(p, placed);
    setResult(ok);
    setResults([...results, ok]);
    recordAnswer('sentence', p.s.id, ok);
    speak(p.s.de);
    if (ok) {
      setXp(xp + 15);
      playCorrect();
    } else {
      playWrong();
    }
  }

  function advance() {
    if (index + 1 < puzzles.length) {
      setIndex(index + 1);
      setPlaced([]);
      setResult(null);
      return;
    }
    const correct = results.filter(Boolean).length;
    finishRound(starKey, starsFor(correct, puzzles.length), xp);
    playFinish();
    setDone(true);
  }

  useEffect(() => {
    if (result !== true) return;
    const timer = setTimeout(advance, 1400);
    return () => clearTimeout(timer);
  }, [result, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (result === null) check();
        else if (result === false) advance();
      } else if (e.key === 'Backspace' && result === null) {
        setPlaced((prev) => prev.slice(0, -1));
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  });

  if (done) {
    const correct = results.filter(Boolean).length;
    return (
      <Results
        correct={correct}
        total={puzzles.length}
        stars={starsFor(correct, puzzles.length)}
        xp={xp}
        mistakes={puzzles
          .filter((_, i) => !results[i])
          .map((x) => ({ key: x.s.id, label: x.s.de, sub: meaning(x.s), say: x.s.de }))}
        onRetry={onRetry}
        onExit={onExit}
      />
    );
  }

  const state = result === null ? '' : result ? 'is-correct' : 'is-wrong';
  return (
    <div class="game">
      <GameBar value={(index + (result !== null ? 1 : 0)) / puzzles.length} onQuit={onExit} />

      <div class="stage">
        <div class={`noun-card sentence-card ${state}`} key={p.s.id}>
          <div class="noun-hint">{t('buildSentence')}</div>
          <div class="sentence-en">{meaning(p.s)}</div>
          {result !== null && <SpeakButton text={p.s.de} />}
        </div>

        <div class="sentence-answer" aria-label={t('buildSentence')}>
          {placed.map((i) => (
            <button class="word-tile placed" onClick={() => unplace(i)} disabled={result !== null}>
              {p.words[i]}
            </button>
          ))}
          {full && <span class="sentence-end">{p.end}</span>}
        </div>

        <div class="feedback" aria-live="polite">
          {result === true && <p class="feedback-ok">{t('correct')}</p>}
          {result === false && (
            <>
              <p class="feedback-bad">
                {t('itIs')} <b>{p.s.de}</b>
              </p>
            </>
          )}
        </div>
      </div>

      <div class="word-bank">
        {p.bank.map((i) => (
          <button class="word-tile" disabled={placed.includes(i) || result !== null} onClick={() => place(i)}>
            {p.words[i]}
          </button>
        ))}
      </div>
      {/* After a mistake, Continue takes the Check button's place. */}
      {result === false ? (
        <button class="btn primary check-btn" onClick={advance}>
          {t('continue')}
        </button>
      ) : (
        <button class="btn primary check-btn" disabled={!full || result !== null} onClick={check}>
          {t('check')}
        </button>
      )}
    </div>
  );
}

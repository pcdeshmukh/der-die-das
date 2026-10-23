import { useEffect, useMemo, useState } from 'preact/hooks';
import { GameBar } from '../components/GameBar';
import { NounLabel } from '../components/NounLabel';
import { Results } from '../components/Results';
import type { WordRef } from '../data/types';
import { formatDuration } from '../lib/duration';
import { meaning, t } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { playCorrect, playFinish, playWrong } from '../lib/sfx';
import { speak } from '../lib/speech';
import { pickWords, starsFor } from '../lib/srs';
import { finishRound, progress, recordAnswer } from '../lib/store';
import type { GameProps } from './types';

const ROUND_SIZE = 15;
const BOARD_SIZE = 5;

/** Splits words into boards of BOARD_SIZE, folding a tiny last board into the previous one. */
function toBoards(words: WordRef[]): WordRef[][] {
  const boards: WordRef[][] = [];
  for (let i = 0; i < words.length; i += BOARD_SIZE) boards.push(words.slice(i, i + BOARD_SIZE));
  if (boards.length > 1 && boards[boards.length - 1].length < 3) boards[boards.length - 2].push(...boards.pop()!);
  return boards;
}

export function MatchGame({ pool, starKey, onRetry, onExit }: GameProps<WordRef>) {
  const [words] = useState(() => pickWords(pool, progress.peek().words, 'meaning', Math.min(ROUND_SIZE, pool.length)));
  const boards = useMemo(() => toBoards(words), [words]);
  const [board, setBoard] = useState(0);
  const left = boards[board];
  const right = useMemo(() => shuffle(left), [left]);

  const [selLeft, setSelLeft] = useState<string | null>(null);
  const [selRight, setSelRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [startedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState<{ correct: number; stars: number; xp: number; time: number } | null>(null);

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [done]);

  function tryPair(l: string, r: string) {
    if (l === r) {
      const next = new Set(matched).add(l);
      setMatched(next);
      setSelLeft(null);
      setSelRight(null);
      recordAnswer('meaning', l, !missed.has(l));
      playCorrect();
      if (next.size === left.length) setTimeout(() => nextBoard(), 450);
    } else {
      setMistakes(mistakes + 1);
      setMissed(new Set(missed).add(l).add(r));
      setWrongPair([l, r]);
      playWrong();
      setTimeout(() => {
        setWrongPair(null);
        setSelLeft(null);
        setSelRight(null);
      }, 500);
    }
  }

  function nextBoard() {
    if (board + 1 < boards.length) {
      setBoard(board + 1);
      setMatched(new Set());
      return;
    }
    const correct = words.length - missed.size;
    const stars = starsFor(correct, words.length);
    const xp = correct * 10;
    finishRound(starKey, stars, xp);
    playFinish();
    setDone({ correct, stars, xp, time: Date.now() - startedAt });
  }

  function tapLeft(w: WordRef) {
    if (matched.has(w.id) || wrongPair) return;
    speak(`${w.article} ${w.de}`);
    if (selRight) tryPair(w.id, selRight);
    else setSelLeft(selLeft === w.id ? null : w.id);
  }

  function tapRight(w: WordRef) {
    if (matched.has(w.id) || wrongPair) return;
    if (selLeft) tryPair(selLeft, w.id);
    else setSelRight(selRight === w.id ? null : w.id);
  }

  if (done) {
    return (
      <Results
        correct={done.correct}
        total={words.length}
        stars={done.stars}
        xp={done.xp}
        mistakes={words
          .filter((w) => missed.has(w.id))
          .map((w) => ({ key: w.id, label: <NounLabel noun={w} />, sub: meaning(w), emoji: w.emoji, say: `${w.article} ${w.de}` }))}
        onRetry={onRetry}
        onExit={onExit}
      >
        <p class="muted">
          ⏱ {formatDuration(done.time)} · {t('mistakes', { n: mistakes })}
        </p>
      </Results>
    );
  }

  const tileClass = (id: string, selected: string | null, side: 0 | 1) =>
    [
      'tile',
      matched.has(id) && 'matched',
      selected === id && 'selected',
      wrongPair && wrongPair[side] === id && 'wrong',
    ]
      .filter(Boolean)
      .join(' ');

  const doneBefore = boards.slice(0, board).reduce((n, b) => n + b.length, 0);
  return (
    <div class="game">
      <GameBar value={(doneBefore + matched.size) / words.length} onQuit={onExit}>
        <span class="timer">⏱ {formatDuration(now - startedAt)}</span>
      </GameBar>
      <p class="muted small center">{t('matchHint')}</p>
      <div class="match-board" key={board}>
        <div class="match-col">
          {left.map((w) => (
            <button class={tileClass(w.id, selLeft, 0)} disabled={matched.has(w.id)} onClick={() => tapLeft(w)}>
              <NounLabel noun={w} />
            </button>
          ))}
        </div>
        <div class="match-col">
          {right.map((w) => (
            <button class={tileClass(w.id, selRight, 1)} disabled={matched.has(w.id)} onClick={() => tapRight(w)}>
              {w.emoji && <span class="tile-emoji">{w.emoji}</span>}
              <span>{meaning(w)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

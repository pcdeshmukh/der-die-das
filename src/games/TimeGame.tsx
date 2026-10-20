import { useState } from 'preact/hooks';
import { Clock } from '../components/Clock';
import { SpeakButton } from '../components/NounPrompt';
import { timeFormal, timeInformal } from '../lib/german';
import { t } from '../lib/i18n';
import { randInt, shuffle } from '../lib/random';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 10;

const pad = (m: number) => String(m).padStart(2, '0');

/** Everyday time on a clock face: the classic trap is "halb drei" = 2:30. */
export function informalTimeQuestion(i: number): ChoiceQuestion {
  const h = randInt(1, 12);
  const m = randInt(0, 11) * 5;
  const answer = timeInformal(h, m);
  const near = [
    timeInformal(h + 1, m), // "halb zwei" vs "halb drei"
    timeInformal(h - 1, m),
    timeInformal(h, (60 - m) % 60), // "Viertel nach" vs "Viertel vor"
    timeInformal(h, (m + 5) % 60),
    timeInformal(h, (m + 55) % 60),
  ];
  const options = shuffle([answer, ...shuffle([...new Set(near)].filter((x) => x !== answer)).slice(0, 3)]);
  return {
    key: `i${i}`,
    prompt: (answered) => (
      <>
        <Clock hour={h} minute={m} />
        <div class="noun-hint">
          {answered ? `${h}:${pad(m)}` : t('whatTime')} · {t('informal')}
        </div>
        {answered && <SpeakButton text={`Es ist ${answer}`} />}
      </>
    ),
    options,
    answer,
    sayAfter: `Es ist ${answer}.`,
    solution: <b>{answer}</b>,
    review: { label: <b>{answer}</b>, sub: `${h}:${pad(m)}`, emoji: '🕒', say: answer },
  };
}

/** Official 24-hour time, as on timetables: watch out for dreizehn vs dreißig. */
export function formalTimeQuestion(i: number): ChoiceQuestion {
  const h = randInt(0, 23);
  const m = randInt(0, 11) * 5;
  const answer = timeFormal(h, m);
  const confusable: Record<number, number> = { 30: 13, 40: 14, 50: 15, 15: 50, 20: 12 };
  const near = [
    timeFormal((h + 1) % 24, m),
    timeFormal((h + 23) % 24, m),
    timeFormal(h, confusable[m] ?? (m + 5) % 60),
    timeFormal(h, (m + 10) % 60),
    timeFormal((h + 12) % 24, m),
  ];
  const options = shuffle([answer, ...shuffle([...new Set(near)].filter((x) => x !== answer)).slice(0, 3)]);
  const digital = `${pad(h)}:${pad(m)}`;
  return {
    key: `f${i}`,
    prompt: (answered) => (
      <>
        <div class="big-number digital">{digital}</div>
        <div class="noun-hint">
          {answered ? answer : t('whatTime')} · {t('formal')}
        </div>
        {answered && <SpeakButton text={answer} />}
      </>
    ),
    options,
    answer,
    sayAfter: answer,
    solution: <b>{answer}</b>,
    review: { label: <b>{answer}</b>, sub: digital, emoji: '🕒', say: answer },
  };
}

export function TimeGame({ starKey, onRetry, onExit }: GameProps) {
  const [questions] = useState(() =>
    shuffle(Array.from({ length: ROUND_SIZE }, (_, i) => (i % 5 < 3 ? informalTimeQuestion(i) : formalTimeQuestion(i)))),
  );
  return <ChoiceGame questions={questions} starKey={starKey} layout="list" onRetry={onRetry} onExit={onExit} />;
}

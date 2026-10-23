import { useState } from 'preact/hooks';
import { NounLabel } from '../components/NounLabel';
import { NounPrompt } from '../components/NounPrompt';
import type { WordRef } from '../data/types';
import { pluralEndingOptions } from '../lib/german';
import { meaning, t } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 12;

/** Bare "–" and "¨" are easy to miss on a button, so they are spelled out. */
const showEnding = (ending: string) =>
  ending === '–' ? `– (${t('pluralSame')})` : ending.startsWith('¨') ? ending.replace(/^¨-?/, (m) => (m === '¨' ? 'Umlaut' : 'Umlaut + -')) : ending;

export function pluralQuestion(w: WordRef): ChoiceQuestion {
  const plural = w.plural!;
  // Options are endings in dictionary notation (-e, ¨-er, -n), so no wrong plural is ever made up.
  const [answer, ...wrong] = pluralEndingOptions(w.de, plural).map(showEnding);
  return {
    key: `plural:${w.id}`,
    statId: w.id,
    skill: 'plural',
    prompt: (answered) => (
      <NounPrompt word={w}>
        <div class="plural-line">
          → <span class="art-die">die</span> {answered ? plural : '___'}
        </div>
        {!answered && <div class="noun-hint">{t('pluralPick')}</div>}
      </NounPrompt>
    ),
    options: shuffle([answer, ...wrong]),
    answer,
    sayAfter: `die ${plural}`,
    solution: <b>die {plural}</b>,
    review: {
      label: (
        <>
          <NounLabel noun={w} /> <span class="word-plural">→ die {plural}</span>
        </>
      ),
      sub: meaning(w),
      emoji: w.emoji,
      say: `${w.article} ${w.de}, die ${plural}`,
    },
    typed: {
      accepted: [plural, `die ${plural}`],
      placeholder: t('typePlural'),
      prompt: (answered) => (
        <NounPrompt word={w}>
          <div class="plural-line">
            → <span class="art-die">die</span> {answered ? plural : '___'}
          </div>
        </NounPrompt>
      ),
    },
  };
}

export function PluralGame({ pool, starKey, onRetry, onExit, typing }: GameProps<WordRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'plural', Math.min(ROUND_SIZE, pool.length)).map(pluralQuestion),
  );
  return <ChoiceGame questions={questions} starKey={starKey} typing={typing} onRetry={onRetry} onExit={onExit} />;
}

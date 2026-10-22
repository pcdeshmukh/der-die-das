import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import type { PhraseRef } from '../data/types';
import { meaning } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 8;

/** A situation in the learner's language; pick the German phrase that fits. */
export function phraseQuestion(item: PhraseRef): ChoiceQuestion {
  return {
    key: `phrase:${item.id}`,
    statId: item.id,
    skill: 'phrases',
    layout: 'list',
    prompt: (answered) => (
      <>
        <div class="noun-emoji" aria-hidden="true">
          {item.lesson.emoji}
        </div>
        <div class="situation">{meaning(item.situation)}</div>
        {/* The card shows the answer, so the feedback line doesn't repeat it. */}
        {answered && (
          <div class="noun-hint">
            <b>{item.a}</b> = {meaning(item)}
          </div>
        )}
        {answered && <SpeakButton text={item.a} />}
      </>
    ),
    options: shuffle([item.a, ...item.wrong]),
    answer: item.a,
    sayAfter: item.a,
    review: { label: item.a, sub: meaning(item), emoji: item.lesson.emoji, say: item.a },
  };
}

export function PhraseGame({ pool, starKey, onRetry, onExit }: GameProps<PhraseRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'phrases', Math.min(ROUND_SIZE, pool.length)).map(phraseQuestion),
  );
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}

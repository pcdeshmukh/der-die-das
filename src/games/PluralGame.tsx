import { useState } from 'preact/hooks';
import { NounLabel } from '../components/NounLabel';
import { NounPrompt } from '../components/NounPrompt';
import type { WordRef } from '../data/types';
import { pluralDistractors } from '../lib/german';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 12;

export function PluralGame({ pool, starKey, onRetry, onExit }: GameProps<WordRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'plural', Math.min(ROUND_SIZE, pool.length)).map((w): ChoiceQuestion => {
      const plural = w.plural!;
      return {
        key: w.id,
        statId: w.id,
        prompt: (answered) => (
          <NounPrompt word={w}>
            <div class="plural-line">
              → <span class="art-die">die</span> {answered ? plural : '___'}
            </div>
          </NounPrompt>
        ),
        options: shuffle([plural, ...shuffle(pluralDistractors(w.de, plural)).slice(0, 3)]),
        answer: plural,
        sayAfter: `die ${plural}`,
        solution: <b>die {plural}</b>,
        review: {
          label: (
            <>
              <NounLabel noun={w} /> <span class="word-plural">→ die {plural}</span>
            </>
          ),
          sub: w.en,
          emoji: w.emoji,
          say: `${w.article} ${w.de}, die ${plural}`,
        },
      };
    }),
  );
  return <ChoiceGame questions={questions} skill="plural" starKey={starKey} layout="grid" onRetry={onRetry} onExit={onExit} />;
}

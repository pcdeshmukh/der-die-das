import { useState } from 'preact/hooks';
import { SpeakButton } from '../components/NounPrompt';
import type { GrammarRef } from '../data/types';
import { meaning, uiLang } from '../lib/i18n';
import { shuffle } from '../lib/random';
import { pickWords } from '../lib/srs';
import { progress } from '../lib/store';
import { ChoiceGame, type ChoiceQuestion } from './ChoiceGame';
import type { GameProps } from './types';

const ROUND_SIZE = 10;
const GAP = '___';

/**
 * At most four options, always shuffled so the right answer never sits in a fixed spot.
 * Long lesson-wide sets (question words) keep the answer plus three others.
 */
function optionsFor(item: GrammarRef): string[] {
  const all = item.options ?? item.lesson.options;
  if (all.length <= 4) return shuffle(all);
  return shuffle([item.a, ...shuffle(all.filter((o) => o !== item.a)).slice(0, 3)]);
}

function GapSentence({ item, answered }: { item: GrammarRef; answered: boolean }) {
  const [before, after] = item.q.split(GAP);
  return (
    <div class="gap-sentence">
      {before}
      <span class={answered ? 'gap-filled' : 'art-blank'}>{answered ? item.a : GAP}</span>
      {after}
    </div>
  );
}

export function grammarQuestion(item: GrammarRef): ChoiceQuestion {
  const hasGap = item.q.includes(GAP);
  // The filled-in sentence; for "pick the sentence" items the answer is the sentence.
  const full = hasGap ? item.q.replace(GAP, item.a) : item.a;
  const spokenPart = full.split(' – ')[0];
  return {
    key: `grammar:${item.id}`,
    statId: item.id,
    skill: 'grammar',
    prompt: (answered) => (
      <>
        {hasGap ? <GapSentence item={item} answered={answered} /> : <div class="noun-word">{item.q}</div>}
        <div class="noun-hint">{meaning(item)}</div>
        {answered && <div class="grammar-rule">💡 {item.lesson.rule[uiLang()]}</div>}
        <SpeakButton text={answered ? spokenPart : hasGap ? item.q.replace(GAP, '…') : item.q} />
      </>
    ),
    options: optionsFor(item),
    answer: item.a,
    sayAfter: spokenPart,
    solution: <b>{item.a}</b>,
    review: { label: full, sub: meaning(item), emoji: item.lesson.emoji, say: spokenPart },
  };
}

export function GrammarGame({ pool, starKey, onRetry, onExit }: GameProps<GrammarRef>) {
  const [questions] = useState(() =>
    pickWords(pool, progress.peek().words, 'grammar', Math.min(ROUND_SIZE, pool.length)).map(grammarQuestion),
  );
  return <ChoiceGame questions={questions} starKey={starKey} onRetry={onRetry} onExit={onExit} />;
}

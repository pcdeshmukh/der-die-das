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
 * At most four options. A lesson-wide set (der/die/das, am/um/im) keeps its order so players learn where to tap;
 * long sets (question words) keep the answer plus three others. Per-item options are shuffled, since content
 * authors tend to list the right answer first.
 */
function optionsFor(item: GrammarRef): string[] {
  if (item.options || item.lesson.shuffle) return shuffle(item.options ?? item.lesson.options);
  const all = item.lesson.options;
  if (all.length <= 4) return all;
  const keep = new Set([item.a, ...shuffle(all.filter((o) => o !== item.a)).slice(0, 3)]);
  return all.filter((o) => keep.has(o));
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
